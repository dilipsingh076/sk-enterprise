import { ProfileForm } from "@/components/profile/ProfileForm";
import { Box } from "@/components/ui";

export default function ProfilePage() {
  return (
    <Box className="mx-auto w-full px-3 py-6 sm:px-4 sm:py-8">
      <ProfileForm />
    </Box>
  );
}
