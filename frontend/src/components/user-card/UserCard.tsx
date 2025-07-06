import type { User } from "../../types";

const UserCard = ({ user }: { user: User }) => {
  return (
    <div className="flex gap-2.5 items-center justify-center">
      <img
        className="w-10 h-auto rounded-full"
        src={user.profile}
        alt={user.name}
      />
      <div className="font-semibold">{user.name}</div>
    </div>
  );
};

export default UserCard;
