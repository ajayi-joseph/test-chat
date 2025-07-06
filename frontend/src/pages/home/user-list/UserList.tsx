import UserCard from "../../../components/user-card/UserCard.tsx";
import Button from "../../../components/button/Button.tsx";
import { useQuery } from "@tanstack/react-query";
import useUserStore from "../../../store/user.store.ts";
import usePageStore from "../../../store/page.store.ts";
import type { User } from "../../../types/index.ts";

const UserList = () => {
	const currentUser = useUserStore((state) => state.currentUser);
	const setCurrentUser = useUserStore((state) => state.setCurrentUser);
	const setCurrentRecipient = useUserStore((state) =>
		state.setCurrentRecipient
	);
	const setCurrentPage = usePageStore((state) => state.setCurrentPage);

	const { data: users } = useQuery<User[]>({
		queryKey: ["users"],
		queryFn: async () => fetch("/api/user/all.json").then((res) => res.json()),
	});

	const switchUser = (userId: number) => {
		const user = users?.find((user) => user.id === userId);
		if (user) {
			setCurrentUser(user);
			setCurrentRecipient(null);
		}
	};

	const messageUser = (userId: number) => {
		const user = users?.find((user) => user.id === userId);
		if (user) {
			setCurrentRecipient(user);
			setCurrentPage("chat");
		}
	};

	return (
		<div className="flex flex-col md:flex-row gap-8">
			<div className="flex-1">
				<h2 className="text-lg font-semibold mb-4">Select Current User</h2>
				<div className="flex flex-col gap-2.5">
					{users?.map((user) => (
						<div className="flex items-center" key={user.id}>
							<UserCard user={user} />
							<div className="ml-auto">
								<Button
									onClick={() =>
										switchUser(user.id)}
									disabled={user.id === currentUser.id}
								>
									{user.id === currentUser.id ? "Current User" : "Switch to"}
								</Button>
							</div>
						</div>
					))}
				</div>
			</div>

			<div className="flex-1">
				<h2 className="text-lg font-semibold mb-4">Message Someone</h2>
				<div className="flex flex-col gap-2.5">
					{users?.map((user) => (
						<div className="flex items-center" key={user.id}>
							<UserCard user={user} />
							<div className="ml-auto">
								<Button
									onClick={() =>
										messageUser(user.id)}
									disabled={user.id === currentUser.id}
								>
									Message
								</Button>
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
};

export default UserList;
