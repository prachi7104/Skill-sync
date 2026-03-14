
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
    const headers: Record<string, string> = {};
    req.headers.forEach((val, key) => {
        headers[key] = val;
    });

    const cookies = req.cookies.getAll().map(c => ({ name: c.name, value: c.value.substring(0, 10) + "..." })); // Mask value

    // Try to decode token using NextAuth's getToken specifically
    let tokenStatus = "Not attempted";
    let tokenError = null;
    let tokenDecoded = null;

    try {
        const token = await getToken({ req });
        if (token) {
            tokenStatus = "Success";
            tokenDecoded = { sub: token.sub, email: token.email, role: token.role };
        } else {
            tokenStatus = "Null (Invalid Signature or Cookie Name?)";
        }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
        tokenStatus = "Error";
        tokenError = err.message;
    }

    return NextResponse.json({
        message: "Auth Debugger",
        receivedCookies: cookies,
        headers: {
            cookie: headers.cookie ? "Present (masked)" : "Missing",
            authorization: headers.authorization ? "Present" : "Missing"
        },
        tokenVerification: {
            status: tokenStatus,
            error: tokenError,
            decoded: tokenDecoded
        },
        env: {
            nextAuthUrl: process.env.NEXTAUTH_URL,
            hasSecret: !!process.env.NEXTAUTH_SECRET
        }
    });
}
