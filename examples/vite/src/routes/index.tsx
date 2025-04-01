import { Link, createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  component: AllExamples,
});

function AllExamples() {
  return (
    <div className="flex flex-col p-4">
      <div className="text-start mt-2">Click on the links to see the examples</div>

      <div className="flex flex-col items-start mt-4">
        <Link to="/main" className="link">
          Main example
        </Link>
      </div>
    </div>
  );
}
