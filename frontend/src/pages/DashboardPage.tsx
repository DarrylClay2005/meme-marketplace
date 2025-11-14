import React from 'react';

export const DashboardPage: React.FC = () => {
  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-semibold">Your Dashboard</h1>
      <p className="text-sm text-slate-300">
        For this capstone, the dashboard is intentionally simple: once you are logged in,
        you can upload new memes and like memes. Purchases are stored in a separate
        Prisma/SQLite table on the backend.
      </p>
      <p className="text-sm text-slate-300">
        You can extend this later to show your own uploaded memes and purchase history by
        adding new API endpoints and calling them here.
      </p>
    </div>
  );
};
