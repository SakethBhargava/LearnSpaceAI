import { Card, CardContent } from "@/components/ui/card";
import { TodoList } from "@/components/todo-list";
import { CheckSquare } from "lucide-react";

export default function TodosPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6 text-foreground transition-colors">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-black flex items-center justify-center gap-2 text-foreground">
          <CheckSquare className="h-8 w-8 text-primary" /> Workspace Tasks
        </h1>
        <p className="text-sm text-muted">
          Manage and track your execution tasks synced directly with your
          personal database engine.
        </p>
      </div>

      <Card className="border-border bg-card shadow-sm p-6 transition-colors">
        <TodoList />
      </Card>
    </div>
  );
}
