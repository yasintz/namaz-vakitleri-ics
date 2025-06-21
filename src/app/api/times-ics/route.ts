import { NextRequest, NextResponse } from 'next/server';
import * as ics from 'ics';
import { ezanVaktiApi, type Vakit } from '@/lib/api';

// Converts a date and time string to a Date object with proper Turkey timezone handling
function toDate(date: Date, time: string): Date {
  const [hour, minute] = time.split(':');

  const newDate = new Date(date);
  newDate.setHours(parseInt(hour, 10), parseInt(minute, 10), 0, 0);

  // Fix timezone issue: Prayer times from the API are in Turkey local time (UTC+3),
  // but when the server runs in UTC, these times get interpreted as UTC times.
  // This causes a 3-hour offset in Google Calendar.
  
  // Turkey timezone offset: UTC+3 (180 minutes)
  const TURKEY_OFFSET_MINUTES = 3 * 60;
  
  // Get server's timezone offset (in minutes from UTC)
  // Note: getTimezoneOffset() returns positive values for UTC- and negative for UTC+
  const serverOffsetMinutes = newDate.getTimezoneOffset();
  
  // Calculate adjustment needed to convert from server time to Turkey time
  // If server is UTC (offset = 0), we need to subtract 180 minutes to get Turkey time
  // If server is already Turkey time (offset = -180), no adjustment needed
  const adjustmentMinutes = TURKEY_OFFSET_MINUTES + serverOffsetMinutes;
  
  // Apply the adjustment
  newDate.setMinutes(newDate.getMinutes() - adjustmentMinutes);

  return newDate;
}

function toStart(date: Date): ics.EventAttributes['start'] {
  return [
    date.getFullYear(),
    date.getMonth() + 1,
    date.getDate(),
    date.getHours(),
    date.getMinutes(),
  ];
}

enum TimeEnum {
  Sobriety,
  Sunrise,
  Afternoon,
  MidAfternoon,
  Evening,
  Night,
}

const titleMapTR: Record<TimeEnum, string> = {
  [TimeEnum.Sobriety]: 'Sabah Namazı',
  [TimeEnum.Sunrise]: 'Güneş Doğuşu',
  [TimeEnum.Afternoon]: 'Öğle Namazı',
  [TimeEnum.MidAfternoon]: 'İkindi Namazı',
  [TimeEnum.Evening]: 'Akşam Namazı',
  [TimeEnum.Night]: 'Yatsı Namazı',
};

const titleMapEN: Record<TimeEnum, string> = {
  [TimeEnum.Sobriety]: 'Fajr Prayer',
  [TimeEnum.Sunrise]: 'Sunrise',
  [TimeEnum.Afternoon]: 'Dhuhr Prayer',
  [TimeEnum.MidAfternoon]: 'Asr Prayer',
  [TimeEnum.Evening]: 'Maghrib Prayer',
  [TimeEnum.Night]: 'Isha Prayer',
};

function toEvent(
  date: Date,
  time: TimeEnum,
  language: 'tr' | 'en' = 'tr'
): ics.EventAttributes {
  const titleMap = language === 'tr' ? titleMapTR : titleMapEN;

  const event: ics.EventAttributes = {
    start: toStart(date),
    duration: { hours: 0, minutes: 15 },
    title: titleMap[time],
    status: 'CONFIRMED',
    busyStatus: 'BUSY',
    categories: ['Prayer Time', 'Islamic'],
    description: `${titleMap[time]} - Prayer time reminder`,
    uid: `${date.getTime()}-${time}`,
  };

  return event;
}

function createEventsPromise(events: ics.EventAttributes[]): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    ics.createEvents(events, (error, value) => {
      if (error) {
        reject(error);
      } else {
        resolve(value);
      }
    });
  });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const districtID =
    searchParams.get('districtID') || searchParams.get('ilceID');
  // Support backward compatibility with old parameters
  const language = (searchParams.get('lang') as 'tr' | 'en') || 'tr';

  try {
    if (!districtID) {
      return NextResponse.json(
        {
          error: 'Missing districtID parameter.',
          hint: 'Use /ulkeler, /sehirler/{ulke}, and /ilceler/{sehir} endpoints to find the correct district ID.',
        },
        { status: 400 }
      );
    }

    let data: Vakit[];

    try {
      data = await ezanVaktiApi.getPrayerTimes(districtID!);
    } catch (apiError) {
      console.error('Error fetching prayer times:', apiError);
      return NextResponse.json(
        {
          error: 'Failed to fetch prayer times from Ezan Vakti API',
          details:
            apiError instanceof Error ? apiError.message : 'Unknown error',
        },
        { status: 502 }
      );
    }

    if (!Array.isArray(data) || data.length === 0) {
      return NextResponse.json(
        { error: 'No prayer times data received for the specified district' },
        { status: 404 }
      );
    }

    const eventsByDay = data.map((time) => {
      const initialDate = new Date(time.MiladiTarihUzunIso8601);

      return [
        toEvent(toDate(initialDate, time.Imsak), TimeEnum.Sobriety, language),
        toEvent(toDate(initialDate, time.Gunes), TimeEnum.Sunrise, language),
        toEvent(toDate(initialDate, time.Ogle), TimeEnum.Afternoon, language),
        toEvent(
          toDate(initialDate, time.Ikindi),
          TimeEnum.MidAfternoon,
          language
        ),
        toEvent(toDate(initialDate, time.Aksam), TimeEnum.Evening, language),
        toEvent(toDate(initialDate, time.Yatsi), TimeEnum.Night, language),
      ];
    });

    const icsResponse = await createEventsPromise(eventsByDay.flat());

    return new Response(icsResponse, {
      status: 200,
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="prayer-times-${districtID}-${language}.ics"`,
        'Cache-Control': 's-maxage=172800, stale-while-revalidate=86400', // 2 days cache, 1 day stale
      },
    });
  } catch (error) {
    console.error('Error generating prayer times calendar:', error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { error: 'Something went wrong while generating the calendar' },
      { status: 500 }
    );
  }
}
