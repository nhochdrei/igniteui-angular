import { AfterViewInit, ChangeDetectorRef, Component, Injectable, OnInit, ViewChild } from "@angular/core";
import { async, fakeAsync, TestBed, tick } from "@angular/core/testing";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { BehaviorSubject } from "rxjs/BehaviorSubject";

import { Observable } from "rxjs/Observable";
import { DataType } from "../data-operations/data-util";
import { IForOfState} from "../directives/for-of/IForOfState";
import { IgxColumnComponent } from "./column.component";
import { IgxGridComponent } from "./grid.component";
import { IgxGridModule } from "./index";

describe("IgxGrid - Grid initialization", () => {

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [
                GridMarkupDeclarationComponent,
                GridAutogeneratedColumnsComponent,
                GridRemoteVirtualizationComponent
            ],
            imports: [
                NoopAnimationsModule,
                IgxGridModule.forRoot()
            ]
        })
        .compileComponents();
    }));

    it("should initialize a grid with columns from markup", () => {
        const fix = TestBed.createComponent(GridMarkupDeclarationComponent);
        fix.detectChanges();

        const grid = fix.componentInstance.instance;

        expect(grid).toBeDefined("Grid initializing through markup failed");
        expect(grid.columnList.length).toEqual(2, "Invalid number of columns initialized");
        expect(grid.rowList.length).toEqual(3, "Invalid number of rows initialized");
    });

    it("should initialize a grid with autogenerated columns", () => {
        const fix = TestBed.createComponent(GridAutogeneratedColumnsComponent);
        fix.detectChanges();

        const grid = fix.componentInstance.instance;

        expect(grid).toBeDefined("Grid initializing through autoGenerate failed");
        expect(grid.columnList.length).toEqual(4, "Invalid number of columns initialized");
        expect(grid.rowList.length).toEqual(3, "Invalid number of rows initialized");
        expect(grid.columnList.first.dataType).toEqual(DataType.Number, "Invalid dataType set on column");
        expect(grid.columnList.find((col) => col.index === 1).dataType)
                .toEqual(DataType.String, "Invalid dataType set on column");
        expect(grid.columnList.find((col) => col.index === 2).dataType)
                .toEqual(DataType.Boolean, "Invalid dataType set on column");
        expect(grid.columnList.last.dataType).toEqual(DataType.Date, "Invalid dataType set on column");
    });

    it("should initialize a grid and emit event on column creation", () => {
        const fix = TestBed.createComponent(GridAutogeneratedColumnsComponent);
        fix.detectChanges();

        expect(fix.componentInstance.columnEventCount).toEqual(4);
    });

    it("should initialize a grid and change column properties during initialization", () => {
        const fix = TestBed.createComponent(GridAutogeneratedColumnsComponent);
        fix.detectChanges();

        const grid = fix.componentInstance.instance;

        grid.columnList.forEach((column) => {
            expect(column.filterable).toEqual(true);
            expect(column.sortable).toEqual(true);
        });
    });

    it("should initialize grid with remove virtualization", (done) => {
        const fix = TestBed.createComponent(GridRemoteVirtualizationComponent);
        fix.detectChanges();
        let rows = fix.componentInstance.instance.rowList.toArray();
        expect(rows.length).toEqual(10);

        const verticalScroll = fix.componentInstance.instance.verticalScrollContainer;
        const elem =  verticalScroll["vh"].instance.elementRef.nativeElement;

        // scroll down
        expect(() => {
            elem.scrollTop = 1000;
            fix.detectChanges();
            fix.componentRef.hostView.detectChanges();
        }).not.toThrow();

        setTimeout(() => {
            fix.detectChanges();
            fix.componentInstance.cdr.detectChanges();
            rows = fix.componentInstance.instance.rowList.toArray();
            const data = fix.componentInstance.data.source.getValue();
            for (let i = fix.componentInstance.instance.virtualizationState.startIndex; i < rows.length; i++) {
                expect(rows[i].rowData["Col1"])
                    .toBe(data[i]["Col1"]);
            }
            done();
        }, 500);
    });
});

@Component({
    template: `
        <igx-grid [data]="data">
            <igx-column field="ID"></igx-column>
            <igx-column field="Name"></igx-column>
        </igx-grid>
    `
})
export class GridMarkupDeclarationComponent {

    public data = [
        { ID: 1, Name: "Johny" },
        { ID: 2, Name: "Sally" },
        { ID: 3, Name: "Tim" }
    ];

    @ViewChild(IgxGridComponent, { read: IgxGridComponent })
    public instance: IgxGridComponent;
}

@Component({
    template: `
        <igx-grid (onColumnInit)="columnCreated($event)" [data]="data" [autoGenerate]="true"></igx-grid>
    `
})
export class GridAutogeneratedColumnsComponent {

    public data = [
        { Number: 1, String: "1", Boolean: true, Date: new Date(Date.now()) },
        { Number: 1, String: "1", Boolean: true, Date: new Date(Date.now()) },
        { Number: 1, String: "1", Boolean: true, Date: new Date(Date.now()) }
    ];

    @ViewChild(IgxGridComponent, { read: IgxGridComponent })
    public instance: IgxGridComponent;

    public columnEventCount = 0;

    public columnCreated(column: IgxColumnComponent) {
        this.columnEventCount++;
        column.filterable = true;
        column.sortable = true;
    }
}

@Injectable()
export class LocalService {
    public records: Observable<any[]>;
    private _records: BehaviorSubject<any[]>;
    private dataStore: any[];

    constructor() {
        this.dataStore = [];
        this._records = new BehaviorSubject([]);
        this.records = this._records.asObservable();
    }

    public getData(data?: IForOfState, cb?: (any) => void): any {
        const size = data.chunkSize === 0 ? 10 : data.chunkSize;
        this.dataStore = this.generateData(data.startIndex, data.startIndex + size);
        this._records.next(this.dataStore);
        const count = 1000;
        if (cb) {
            cb(count);
        }
    }

    public generateData(start, end) {
        const dummyData = [];
        for (let i = start; i < end; i++) {
            dummyData.push({ Col1: 10 * i});
        }
        return dummyData;
    }
}

@Component({
    template: `
        <igx-grid [data]="data | async" (onDataPreLoad)="dataLoading($event)" [height]="'600px'">
            <igx-column [sortable]="true" [filterable]="true" [field]="'Col1'" [header]="'Col1'">
            </igx-column>
        </igx-grid>
    `,
    providers: [LocalService]
})
export class GridRemoteVirtualizationComponent implements OnInit, AfterViewInit {
    public data;
    @ViewChild(IgxGridComponent, { read: IgxGridComponent })
    public instance: IgxGridComponent;
    constructor(private localService: LocalService, public cdr: ChangeDetectorRef) { }
    public ngOnInit(): void {
        this.data = this.localService.records;
    }

    public ngAfterViewInit() {
        this.localService.getData(this.instance.virtualizationState, (count) => {
            this.instance.totalItemCount = count;
            this.cdr.detectChanges();
        });
    }

    dataLoading(evt) {
        this.localService.getData(evt, () => {
            this.cdr.detectChanges();
        });
    }
}
