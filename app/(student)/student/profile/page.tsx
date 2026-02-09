import { requireStudentProfile } from "@/lib/auth/helpers";
import ProfileView from "./profile-view";

import { format } from "date-fns";

export default async function StudentProfilePage() {
    const { user, profile } = await requireStudentProfile();

    // Serialize and format dates for Client Component to avoid hydration mismatches
    const serializedUser = {
        ...user,
        // Format: "September 2025" or similar, matching what the UI needs
        createdAt: format(user.createdAt, "MMMM yyyy"),
        updatedAt: user.updatedAt.toISOString(),
    };

    const serializedProfile = {
        ...profile,
        createdAt: profile.createdAt.toISOString(),
        updatedAt: profile.updatedAt.toISOString(),
        // Format: "Jan 15, 2025"
        resumeUploadedAt: profile.resumeUploadedAt ? format(profile.resumeUploadedAt, "MMM d, yyyy") : null,
        // JSON fields are already objects/arrays, so they pass fine
    };

    return <ProfileView user={serializedUser} profile={serializedProfile} />;
}
