import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Boxes } from "lucide-react";
import type { ProjectSummaryDto } from "@/application/dtos/memberAchievement";
import { SectionHeading } from "./SectionHeading";

interface ProjectListProps {
  projects: readonly ProjectSummaryDto[];
}

/**
 * 참여 프로젝트 섹션
 */
export function ProjectList({ projects }: ProjectListProps) {
  return (
    <section className="py-10 md:py-16">
      <div className="container-custom">
        <SectionHeading
          eyebrow="PROJECTS"
          title="참여 프로젝트"
          description={
            projects.length > 0
              ? `${projects.length}건의 프로젝트에 참여했습니다.`
              : "아직 참여한 프로젝트가 없습니다."
          }
        />

        {projects.length > 0 && (
          <ul className="grid gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3" data-member-reveal>
            {projects.map((project) => (
              <li key={project.id}>
                <ProjectCard project={project} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function ProjectCard({ project }: { project: ProjectSummaryDto }) {
  const content = (
    <>
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
        {project.thumbnailUrl ? (
          <Image
            src={project.thumbnailUrl}
            alt=""
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />
        ) : (
          <span className="flex h-full items-center justify-center">
            <Boxes className="h-9 w-9 text-muted-foreground/40" aria-hidden />
          </span>
        )}

        <span className="absolute left-3 top-3 bg-black/70 px-2.5 py-1 text-[10px] font-medium tracking-wider text-white backdrop-blur">
          {project.role}
        </span>
      </div>

      <div className="pt-4">
        <div className="mb-1.5 flex flex-wrap items-center gap-2">
          <span className="font-mono text-[10px] font-semibold text-primary">
            {project.generation}기
          </span>
          {project.platform && (
            <span className="text-[10px] text-muted-foreground">
              {project.platform}
            </span>
          )}
        </div>

        <p className="flex items-center gap-1 text-lg font-semibold text-foreground transition-colors group-hover:text-primary">
          {project.projectName}
          {project.blogUrl && (
            <ArrowUpRight
              className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              aria-hidden
            />
          )}
        </p>

        {project.description && (
          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
            {project.description}
          </p>
        )}
      </div>
    </>
  );

  const className =
    "group block h-full";

  if (!project.blogUrl) {
    return <div className={className}>{content}</div>;
  }

  return (
    <Link
      href={project.blogUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
    >
      {content}
    </Link>
  );
}
