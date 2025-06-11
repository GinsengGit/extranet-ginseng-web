"use client"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useUser } from "@/context/UserContext"; // adapte ce chemin si besoin

export default function ProfileAvatar() {
  const { user, setUser } = useUser();

  if (!user) return null;

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = ev.target?.result as string;
      // Appel à l’API PATCH pour mettre à jour l’avatar
      await fetch("/api/user/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user.email,
          avatarUrl: base64,
        }),
      });
      // Mets à jour le state utilisateur pour afficher la nouvelle image instantanément
      setUser({ ...user, avatarUrl: base64 });
    };
    reader.readAsDataURL(file);
  };

  return (
    <label className="cursor-pointer flex items-center gap-2">
      <Avatar className="w-10 h-10">
        <AvatarImage src={user.avatarUrl || "/placeholder.svg"} alt={user.firstName || "profile"} />
        <AvatarFallback>
          {user.firstName?.[0]}
          {user.lastName?.[0]}
        </AvatarFallback>
      </Avatar>
      <input
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleAvatarChange}
      />
      <span className="text-xs text-gray-500 hover:underline">Changer</span>
    </label>
  );
}