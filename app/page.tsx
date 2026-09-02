import VideoFeed from "@/components/video-feed";
import ProfileSpotlight from "@/components/profile-spotlight";

export default function Home() {
  return (
    <main className="flex flex-1 justify-center bg-fond-page px-6 py-10 lg:px-[100px]">
      <div className="grid w-full max-w-[1280px] grid-cols-1 items-start gap-10 lg:grid-cols-2 lg:gap-[75px]">
        <div className="flex justify-center lg:justify-end">
          <VideoFeed />
        </div>
        <div className="flex flex-col gap-5">
          <ProfileSpotlight />
        </div>
      </div>
    </main>
  );
}
