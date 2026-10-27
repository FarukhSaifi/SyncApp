import { DATA_TABLE, SYNC_LABEL } from "@constants";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import DataTable from "./DataTable";

type Row = { id: string; name: string };

const columns = [{ id: "name", header: "Name", sortable: true, cell: (row: Row) => row.name }];

describe("DataTable", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders empty state when there are no rows", () => {
    render(<DataTable<Row> columns={columns} rows={[]} getRowId={(row) => row.id} loading={false} />);
    expect(screen.getByText(SYNC_LABEL.DATA_TABLE_NO_RESULTS)).toBeInTheDocument();
  });

  it("renders loading skeleton when loading with no rows", () => {
    const { container } = render(<DataTable<Row> columns={columns} rows={[]} getRowId={(row) => row.id} loading />);
    expect(container.querySelector(`.${DATA_TABLE.SKELETON_ROW.split(" ")[0]}`)).toBeTruthy();
  });

  it("cycles sort direction on sortable header clicks", async () => {
    const onSortChange = vi.fn();
    render(
      <DataTable<Row>
        columns={columns}
        rows={[{ id: "1", name: "Alpha" }]}
        getRowId={(row) => row.id}
        sort={{ key: null, direction: DATA_TABLE.SORT_ASC, onChange: onSortChange }}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: SYNC_LABEL.DATA_TABLE_SORT_ARIA("Name") }));
    expect(onSortChange).toHaveBeenCalledWith({ key: "name", direction: DATA_TABLE.SORT_ASC });
  });

  it("renders mobile rows and pagination footer", () => {
    render(
      <DataTable<Row>
        columns={columns}
        rows={[{ id: "1", name: "Alpha" }]}
        getRowId={(row) => row.id}
        mobileRow={(row) => <div data-testid="mobile-row">{row.name}</div>}
        pagination={{
          page: 1,
          pages: 3,
          onPrev: vi.fn(),
          onNext: vi.fn(),
          onPageChange: vi.fn(),
        }}
      />,
    );
    expect(screen.getByTestId("mobile-row")).toHaveTextContent("Alpha");
    expect(screen.getByRole("navigation")).toBeInTheDocument();
  });
});
