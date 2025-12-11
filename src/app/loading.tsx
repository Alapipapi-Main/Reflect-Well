import { Loader } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex items-center justify-center h-screen">
      <Loader className="h-12 w-12 animate-spin text-primary" />
    </div>
  );
}
