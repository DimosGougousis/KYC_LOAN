import type { ReactNode } from 'react';
import { Panel } from './primitives';

export function DataTable({ children, caption }: { children: ReactNode; caption?: string }) {
  return (
    <Panel className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="data-table">
          {caption && <caption className="sr-only">{caption}</caption>}
          {children}
        </table>
      </div>
    </Panel>
  );
}
