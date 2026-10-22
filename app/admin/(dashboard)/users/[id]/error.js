"use client";
export default function UserDetailsError({ reset }) {
  return <div className="panel stack" role="alert"><h2>Unable to load user details</h2><p>Please try again.</p><button className="button-secondary" onClick={reset}>Try again</button></div>;
}
