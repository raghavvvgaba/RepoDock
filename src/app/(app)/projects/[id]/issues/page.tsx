import { redirect } from "next/navigation";

type ProjectIssuesPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ProjectIssuesPage({ params }: ProjectIssuesPageProps) {
  const { id } = await params;
  redirect(`/projects/${id}`);
}
