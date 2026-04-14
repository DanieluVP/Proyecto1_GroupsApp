import { MessageSquare } from 'lucide-react';

export default function GroupsPage() {
  return (
    <div className="flex h-full items-center justify-center text-center">
      <div>
        <MessageSquare size={48} className="text-gray-600 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-400">Select a group</h2>
        <p className="text-gray-600 text-sm mt-1">
          Choose a group from the sidebar or create one with{' '}
          <span className="text-gray-500">+</span>
        </p>
      </div>
    </div>
  );
}
