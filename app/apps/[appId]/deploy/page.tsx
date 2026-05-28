import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  apps,
  getProjectById,
  getSubmissionByAppId,
  projectAppMap,
  personas,
  coReviewerPersona,
} from '@/lib/mock-data';
import { DeployFlow } from '@/components/deploy/DeployFlow';
import { Footer } from '@/components/shell/Footer';

interface PageProps {
  params: Promise<{ appId: string }>;
}

export function generateStaticParams() {
  return apps.map((a) => ({ appId: a.id }));
}

export default async function DeployPage({ params }: PageProps) {
  const { appId } = await params;
  const app = apps.find((a) => a.id === appId);
  if (!app) notFound();

  const project = getProjectById(projectAppMap[app.id]);
  const submission = getSubmissionByAppId(app.id);
  const targetVersion = app.deployedVersion + 1;

  const reviewerInitials = submission
    ? submission.reviewers
        .filter((r) => r.decision === 'approved')
        .map((r) => (r.personaId === 'u_rs' ? personas.reviewer.initials : coReviewerPersona.initials))
    : [personas.reviewer.initials, coReviewerPersona.initials];

  return (
    <div className="space-y-5">
      <nav className="text-xs text-foreground-muted flex items-center gap-2">
        {project && (
          <>
            <Link
              href={`/projects/${project.id}`}
              className="hover:text-foreground transition-colors"
            >
              {project.name}
            </Link>
            <span className="text-foreground-subtle">/</span>
          </>
        )}
        <Link href="/apps" className="hover:text-foreground transition-colors">
          Apps
        </Link>
        <span className="text-foreground-subtle">/</span>
        <Link href={`/apps/${app.id}`} className="hover:text-foreground transition-colors font-mono">
          {app.name}
        </Link>
        <span className="text-foreground-subtle">/</span>
        <span className="text-foreground">Deploy</span>
      </nav>

      <header className="pb-4 border-b border-border-muted">
        <h1 className="text-2xl font-semibold tracking-tight">
          Deploy <span className="font-mono">{app.name}</span> v{targetVersion}
        </h1>
        <p className="text-xs text-foreground-muted mt-1.5">
          Approved by {reviewerInitials.length > 0 ? reviewerInitials.join(' and ') : 'reviewers'}
          {submission?.submittedAgo ? ` · submitted ${submission.submittedAgo}` : ''}
        </p>
      </header>

      <DeployFlow
        appId={app.id}
        appName={app.name}
        version={targetVersion}
        prevDeployedVersion={app.deployedVersion > 0 ? app.deployedVersion : null}
        channels={app.channels}
        evaluationScore={app.evaluationScore}
        reviewerInitials={reviewerInitials}
      />

      <Footer />
    </div>
  );
}
