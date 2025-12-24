import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const role = searchParams.get('role');
  const next = searchParams.get('next');

  // Determine redirect destination based on role
  let redirectPath = '/account';
  if (role === 'employer') {
    redirectPath = '/employers/setup';
  } else if (role === 'candidate') {
    redirectPath = '/account/candidate/setup';
  } else if (next) {
    redirectPath = next;
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(`${origin}${redirectPath}`);
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/signin?error=auth_callback_error`);
}
