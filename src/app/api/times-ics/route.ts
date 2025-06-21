import { NextRequest, NextResponse } from "next/server";
import { DateTime } from "luxon";
import * as ics from "ics";
import { ezanVaktiApi, type Vakit } from "@/lib/api";

function toDate(date: Date, time: string): DateTime {
  const [hour, minute] = time.split(":");

  // Create the date in Turkey timezone (Europe/Istanbul - GMT+3)
  const newDate = DateTime.fromJSDate(date, { zone: 'Europe/Istanbul' }).set({
    hour: parseInt(hour, 10),
    minute: parseInt(minute, 10),
    second: 0,
    millisecond: 0,
  });

  return newDate;
}

function toStart(dateTime: DateTime): ics.EventAttributes["start"] {
  return [
    dateTime.year,
    dateTime.month,
    dateTime.day,
    dateTime.hour,
    dateTime.minute,
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
  [TimeEnum.Sobriety]: "Sabah Namazı",
  [TimeEnum.Sunrise]: "Güneş Doğuşu",
  [TimeEnum.Afternoon]: "Öğle Namazı",
  [TimeEnum.MidAfternoon]: "İkindi Namazı",
  [TimeEnum.Evening]: "Akşam Namazı",
  [TimeEnum.Night]: "Yatsı Namazı",
};

const titleMapEN: Record<TimeEnum, string> = {
  [TimeEnum.Sobriety]: "Fajr Prayer",
  [TimeEnum.Sunrise]: "Sunrise",
  [TimeEnum.Afternoon]: "Dhuhr Prayer",
  [TimeEnum.MidAfternoon]: "Asr Prayer",
  [TimeEnum.Evening]: "Maghrib Prayer",
  [TimeEnum.Night]: "Isha Prayer",
};

function toEvent(dateTime: DateTime, time: TimeEnum, language: 'tr' | 'en' = 'tr'): ics.EventAttributes {
  const titleMap = language === 'tr' ? titleMapTR : titleMapEN;
  
  const event: ics.EventAttributes = {
    start: toStart(dateTime),
    startInputType: 'local',
    startOutputType: 'utc',
    duration: { hours: 0, minutes: 15 },
    title: titleMap[time],
    status: "CONFIRMED",
    busyStatus: "BUSY",
    categories: ["Prayer Time", "Islamic"],
    description: `${titleMap[time]} - Prayer time reminder`,
    geo: { lat: 41.0082, lon: 28.9784 }, // Istanbul coordinates as reference
  };

  return event;
}

function createEventsPromise(events: ics.EventAttributes[]): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    ics.createEvents(events, {
      productId: 'Prayer Times Calendar',
      calName: 'Islamic Prayer Times'
    }, (error, value) => {
      if (error) {
        reject(error);
      } else {
        // Add timezone information to the ICS content
        let modifiedValue = value?.replace(
          'BEGIN:VCALENDAR',
          'BEGIN:VCALENDAR\r\nBEGIN:VTIMEZONE\r\nTZID:Europe/Istanbul\r\nBEGIN:STANDARD\r\nDTSTART:20071028T040000\r\nTZNAME:+03\r\nTZOFFSETFROM:+0300\r\nTZOFFSETTO:+0300\r\nRRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU\r\nEND:STANDARD\r\nEND:VTIMEZONE'
        );
        
        // Add timezone reference to each event
        modifiedValue = modifiedValue?.replace(
          /DTSTART:(\d{8}T\d{6}Z?)/g,
          'DTSTART;TZID=Europe/Istanbul:$1'.replace('Z', '')
        );
        resolve(modifiedValue || '');
      }
    });
  });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const districtID = searchParams.get("districtID") || searchParams.get("ilceID");
  // Support backward compatibility with old parameters
  const countryID = searchParams.get("countryID") || searchParams.get("cityID");
  const language = searchParams.get("lang") as 'tr' | 'en' || 'tr';

  try {
    if (!districtID && !countryID) {
      return NextResponse.json(
        { 
          error: "Missing districtID parameter. Use districtID to specify the district for prayer times.",
          hint: "Use /ulkeler, /sehirler/{ulke}, and /ilceler/{sehir} endpoints to find the correct district ID."
        },
        { status: 400 }
      );
    }

    // If only countryID is provided, return error asking for district ID
    if (!districtID && countryID) {
      return NextResponse.json(
        { 
          error: "districtID is required. countryID alone is not sufficient.",
          hint: "Please select a city and district first. Use the frontend to navigate: Country → City → District."
        },
        { status: 400 }
      );
    }

    let data: Vakit[];
    
    try {
      data = await ezanVaktiApi.getPrayerTimes(districtID!);
    } catch (apiError) {
      console.error("Error fetching prayer times:", apiError);
      return NextResponse.json(
        { 
          error: "Failed to fetch prayer times from Ezan Vakti API",
          details: apiError instanceof Error ? apiError.message : "Unknown error"
        },
        { status: 502 }
      );
    }

    if (!Array.isArray(data) || data.length === 0) {
      return NextResponse.json(
        { error: "No prayer times data received for the specified district" },
        { status: 404 }
      );
    }

    const eventsByDay = data.map((time) => {
      const initialDate = new Date(time.MiladiTarihUzunIso8601);

      return [
        toEvent(toDate(initialDate, time.Imsak), TimeEnum.Sobriety, language),
        toEvent(toDate(initialDate, time.Gunes), TimeEnum.Sunrise, language),
        toEvent(toDate(initialDate, time.Ogle), TimeEnum.Afternoon, language),
        toEvent(toDate(initialDate, time.Ikindi), TimeEnum.MidAfternoon, language),
        toEvent(toDate(initialDate, time.Aksam), TimeEnum.Evening, language),
        toEvent(toDate(initialDate, time.Yatsi), TimeEnum.Night, language),
      ];
    });

    const events = eventsByDay.reduce((acc, cur) => {
      acc.push(...cur);
      return acc;
    }, [] as ics.EventAttributes[]);

    const icsResponse = await createEventsPromise(events);

    return new Response(icsResponse, {
      status: 200,
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": `attachment; filename="prayer-times-${districtID}-${language}.ics"`,
        "Cache-Control": "s-maxage=172800, stale-while-revalidate=86400", // 2 days cache, 1 day stale
      },
    });
  } catch (error) {
    console.error("Error generating prayer times calendar:", error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: "Something went wrong while generating the calendar" },
      { status: 500 }
    );
  }
} 