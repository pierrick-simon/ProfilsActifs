import VideoFeed from "@/components/video-feed";
import ProfileSpotlight from "@/components/profile-spotlight";
import RequireRegistration from "@/components/require-registration";
import SignOutButton from "@/components/sign-out-button";

export default function Home() {
  return (
    <RequireRegistration>
      <main className="flex flex-1 flex-col items-center bg-fond-page px-6 py-10 lg:px-[100px]">
        <div className="flex w-full max-w-[1280px] justify-end">
          <SignOutButton />
        </div>
        <div className="grid w-full max-w-[1280px] grid-cols-1 items-start gap-10 pt-6 lg:grid-cols-2 lg:gap-[75px]">
          <div className="flex justify-center lg:justify-end">
            <VideoFeed />
          </div>
          <div className="flex flex-col gap-5">
            <ProfileSpotlight />
          </div>
        </div>
      </main>
    </RequireRegistration>
  );
}
