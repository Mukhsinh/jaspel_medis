import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
    // Development mode: bypass authentication
    // TODO: Re-enable Supabase Auth for production deployment
    const response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    });

    return response;
}

export const config = {
    matcher: [
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ],
};
