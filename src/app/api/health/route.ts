export function GET() {
  return Response.json(
    {
      ok: true,
      service: "capitalflowai",
      timestamp: new Date().toISOString()
    },
    { status: 200 }
  );
}

