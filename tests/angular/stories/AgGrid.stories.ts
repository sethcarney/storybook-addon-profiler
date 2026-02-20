import { Component, Input, OnChanges } from '@angular/core'
import type { Meta, StoryObj } from '@storybook/angular'
import { AgGridAngular } from 'ag-grid-angular'
import type { ColDef } from 'ag-grid-community'
import { AllCommunityModule, ModuleRegistry, themeQuartz } from 'ag-grid-community'

ModuleRegistry.registerModules([AllCommunityModule])

// ---------------------------------------------------------------------------
// Data model
// ---------------------------------------------------------------------------

interface Employee {
  id: number
  firstName: string
  lastName: string
  age: number
  email: string
  department: string
  country: string
  salary: number
  yearsAtCompany: number
  performanceRating: string
  isActive: boolean
}

const FIRST_NAMES = [
  'Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank', 'Grace', 'Henry',
  'Ivy', 'Jack', 'Karen', 'Liam', 'Mia', 'Noah', 'Olivia', 'Paul',
  'Quinn', 'Rachel', 'Sam', 'Tara',
]
const LAST_NAMES = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller',
  'Davis', 'Wilson', 'Taylor', 'Anderson', 'Thomas', 'Jackson', 'White',
  'Harris', 'Martin', 'Thompson', 'Young', 'Lee', 'Walker',
]
const DEPARTMENTS = [
  'Engineering', 'Marketing', 'Sales', 'HR', 'Finance',
  'Product', 'Design', 'Legal', 'Operations', 'Support',
]
const COUNTRIES = [
  'USA', 'UK', 'Canada', 'Germany', 'France',
  'Japan', 'Australia', 'Brazil', 'India', 'Netherlands',
]
const PERFORMANCE_RATINGS = [
  'Outstanding', 'Exceeds Expectations', 'Meets Expectations', 'Below Expectations',
]

function generateEmployees(count: number): Employee[] {
  return Array.from({ length: count }, (_, i) => {
    const fn = FIRST_NAMES[i % FIRST_NAMES.length]
    const ln = LAST_NAMES[Math.floor(i / FIRST_NAMES.length) % LAST_NAMES.length]
    return {
      id: i + 1,
      firstName: fn,
      lastName: ln,
      age: 22 + (i % 43),
      email: `${fn.toLowerCase()}.${ln.toLowerCase()}${i + 1}@acme.com`,
      department: DEPARTMENTS[i % DEPARTMENTS.length],
      country: COUNTRIES[i % COUNTRIES.length],
      salary: 35000 + (i % 100) * 1500,
      yearsAtCompany: i % 15,
      performanceRating: PERFORMANCE_RATINGS[i % PERFORMANCE_RATINGS.length],
      isActive: i % 8 !== 0,
    }
  })
}

// ---------------------------------------------------------------------------
// Wrapper component
// ---------------------------------------------------------------------------

@Component({
  selector: 'app-employee-grid',
  standalone: true,
  imports: [AgGridAngular],
  template: `
    <div style="width: 100%; height: 540px">
      <ag-grid-angular
        style="height: 100%"
        [theme]="theme"
        [rowData]="rowData"
        [columnDefs]="colDefs"
        [defaultColDef]="defaultColDef"
        [pagination]="pagination"
        [paginationPageSize]="paginationPageSize"
      />
    </div>
  `,
})
export class EmployeeGridComponent implements OnChanges {
  @Input() rowCount = 200
  @Input() pagination = false
  @Input() paginationPageSize = 20

  readonly theme = themeQuartz

  rowData: Employee[] = generateEmployees(this.rowCount)

  readonly defaultColDef: ColDef = {
    flex: 1,
    minWidth: 120,
    filter: true,
    resizable: true,
  }

  readonly colDefs: ColDef<Employee>[] = [
    { field: 'id', headerName: 'ID', width: 80, pinned: 'left', filter: 'agNumberColumnFilter' },
    { field: 'firstName', headerName: 'First Name' },
    { field: 'lastName', headerName: 'Last Name' },
    { field: 'age', headerName: 'Age', width: 90, filter: 'agNumberColumnFilter' },
    { field: 'email', headerName: 'Email', minWidth: 240 },
    { field: 'department', headerName: 'Department' },
    { field: 'country', headerName: 'Country' },
    {
      field: 'salary',
      headerName: 'Salary',
      filter: 'agNumberColumnFilter',
      valueFormatter: (p) => (p.value != null ? `$${p.value.toLocaleString()}` : ''),
    },
    { field: 'yearsAtCompany', headerName: 'Years', width: 100, filter: 'agNumberColumnFilter' },
    { field: 'performanceRating', headerName: 'Performance' },
    { field: 'isActive', headerName: 'Active', width: 100 },
  ]

  ngOnChanges(): void {
    this.rowData = generateEmployees(this.rowCount)
  }
}

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

const meta: Meta<EmployeeGridComponent> = {
  title: 'Performance/Employee Grid',
  component: EmployeeGridComponent,
  parameters: { layout: 'padded' },
  argTypes: {
    rowCount: { control: { type: 'number', min: 10, max: 10000, step: 100 } },
    paginationPageSize: { control: { type: 'number', min: 5, max: 100, step: 5 } },
  },
}

export default meta
type Story = StoryObj<EmployeeGridComponent>

/** 200 rows with sort + filter — good baseline for the profiler. */
export const BasicGrid: Story = {
  args: { rowCount: 200, pagination: false, paginationPageSize: 20 },
}

/** 500 rows split into pages of 25. */
export const WithPagination: Story = {
  args: { rowCount: 500, pagination: true, paginationPageSize: 25 },
}

/** 5 000 rows rendered at once — exercises virtual scrolling and stresses the perf collectors. */
export const LargeDataset: Story = {
  args: { rowCount: 5000, pagination: false, paginationPageSize: 20 },
}
