export default function ProjectPage({ params }: { params: { projectId: string } }) {
  const { projectId } = params;
  
  return (
    <div>
      <h1>Project {projectId}</h1>
    </div>
  );
} 