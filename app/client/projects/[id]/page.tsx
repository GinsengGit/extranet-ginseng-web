export default function ProjectPage({ params }: { params: { id: string } }) {
  const { id } = params;
  
  return (
    <div>
      <h1>Project {id}</h1>
    </div>
  );
} 