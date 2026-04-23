import React from "react";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";

interface DataGridProps {
  rowData: any[];
  columnDefs: any[];
  noRowsOverlayComponent?: () => React.ReactNode;
  onGridReady?: (params: any) => void;
  onRowClicked?: (event: any) => void;
  rowStyle?: any;
  getRowClass?: (params: any) => string | string[] | undefined;
  getRowHeight?: (params: any) => number | undefined | null;
  getRowId?: (params: any) => string;
  enableFilterHandlers?: boolean;
  sideBar?: any;
}

export const DataGrid: React.FC<DataGridProps> = ({
  rowData,
  columnDefs,
  noRowsOverlayComponent,
  onGridReady,
  onRowClicked,
  rowStyle,
  getRowClass,
  getRowHeight,
  getRowId,
  sideBar,
}) => (
  <div className="ag-theme-alpine" style={{ width: "100%", height: 500 }}>
    <AgGridReact
      rowData={rowData}
      columnDefs={columnDefs}
      noRowsOverlayComponent={noRowsOverlayComponent}
      onGridReady={onGridReady}
      onRowClicked={onRowClicked}
      rowStyle={rowStyle}
      getRowClass={getRowClass}
      getRowHeight={getRowHeight}
      getRowId={getRowId}
      sideBar={sideBar}
      domLayout="normal"
    />
  </div>
);

export const LettuceAgGrid = DataGrid;
