import { redirect } from "next/navigation";

type IssuePageProps = {
  params: Promise<{ id: string; issueNumber: string }>;
};

export default async function ProjectIssuePage({ params }: IssuePageProps) {
  const { id } = await params;
  redirect(`/projects/${id}`);
}
