'use server';
import { headers } from 'next/headers';

export default async function Page({ searchParams }: { searchParams: Promise<{ districtID: string; lang: string }> }) {
  const host = (await headers()).get('host');
  const protocol = (await headers()).get('x-forwarded-proto');
  const { districtID, lang } = await searchParams;
  const details = await fetch(
    `${protocol}://${host}/api/times-ics?districtID=${districtID}&lang=${lang}`
  );
  const data = await details.text();
  return (
    <div className="bg-white p-4 rounded-lg shadow-md text-black">
      <pre>{data}</pre>
    </div>
  );
}
