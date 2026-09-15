export function GET() {
  return Response.json({ ok: true, date: new Date().toISOString() });
}
