// denominations
const DENOM_KEYS = ['denom_1', 'denom_5', 'denom_10', 'denom_50', 'denom_100', 'denom_500', 'denom_1000', 'denom_5000'];
const DENOM_VALUES = {
    denom_1: 1,
    denom_5: 5,
    denom_10: 10,
    denom_50: 50,
    denom_100: 100,
    denom_500: 500,
    denom_1000: 1000,
    denom_5000: 5000,
};
// styling
const DENOM_COLORS = {
    total: 'rgba(55, 47, 68, 0.7)',
    denom_1: 'rgba(255, 255, 51, 0.7)',
    denom_5: 'rgba(255, 102 ,51 , 0.7)',
    denom_10: 'rgba(255, 153 ,51 , 0.7)',
    denom_50: 'rgba(255, 51, 51,0.7)',
    denom_100: 'rgba(51, 255, 153,0.7)',
    denom_500: 'rgba(51, 204, 153, 0.7)',
    denom_1000: 'rgba(51, 153, 153, 0.7)',
    denom_5000: 'rgba(51, 102, 153, 0.7)'
};
const DENOM_COLORS2 = {
    total: 'rgba(55, 47, 68, 0.3)',
    denom_1: 'rgba(255, 255, 51, 0.3)',
    denom_5: 'rgba(255, 102 ,51 , 0.3)',
    denom_10: 'rgba(255, 153 ,51 , 0.3)',
    denom_50: 'rgba(255, 51, 51,0.3)',
    denom_100: 'rgba(51, 255, 153,0.3)',
    denom_500: 'rgba(51, 204, 153, 0.3)',
    denom_1000: 'rgba(51, 153, 153, 0.3)',
    denom_5000: 'rgba(51, 102, 153, 0.3)'
};
const MINT_COLOR = ['rgba(0, 255, 0, 0.8)', 'rgba(0, 255, 0, 0.3)'];
const SPEND_COLOR = ['rgba(0, 0, 255, 0.8)', 'rgba(0, 0, 255, 0.3)'];

// blocks data
const block_data = JSON.parse(supply_data_Json);
const LAST_BLOCK_NUM = block_data.blocks_axis[block_data.blocks_axis.length-1];
const zpwrbsupplydata = block_data.zpwrbSupply;
const mintsupplydata = block_data.zpwrbMints;
let spendsupplydata = {};

// charts DOM elements
const supply_ctx = {
    "total": document.getElementById("canv_supply_01_ctx"),
    "denom_1": document.getElementById("canv_supply_03_ctx"),
    "denom_5": document.getElementById("canv_supply_04_ctx"),
    "denom_10": document.getElementById("canv_supply_05_ctx"),
    "denom_50": document.getElementById("canv_supply_06_ctx"),
    "denom_100": document.getElementById("canv_supply_07_ctx"),
    "denom_500": document.getElementById("canv_supply_08_ctx"),
    "denom_1000": document.getElementById("canv_supply_09_ctx"),
    "denom_5000": document.getElementById("canv_supply_10_ctx")
};
const zpwrbamount_ctx = document.getElementById("canv_supply_02_ctx");
const zpwrbsupplynow_ctx = document.getElementById("zpnowChart");

// charts objects
var zpwrbamountChart, zpwrbsupplynowChart;
var supplyChart = {};

function AddSupplyToolTip(chart) {
    chart.options.tooltips.callbacks.label = function(tooltipItem, data) {
        let this_dataset = data.datasets[tooltipItem.datasetIndex];
        // axis0 return millions rounded to two decimal places
        if (this_dataset.yAxisID == "axis0") {
            let label = Math.round(tooltipItem.value / 10000) / 100;
            return this_dataset.label + ": " + label + 'M PWRB';
        } else {
            // for axis1 return regular label
            return this_dataset.label + ": " + tooltipItem.value;
        }
    }
}

// returns zpwrbsupplyChart dataPoints for range (x-axis)
function GetSupplyDataPoints(bl_from, bl_to, denom_key) {
    // range object used for dataSets - initialize empty
    var rangeObj = {
        blocks_axis: [],
        time_axis: [],
        zpwrbSupply: {},
        zpwrbMints: {},
        zpwrbSpends: {}
    };

    if (denom_key == "total") {
        for (const d_key of DENOM_KEYS) {
            rangeObj.zpwrbSupply[d_key] = [];
            rangeObj.zpwrbMints[d_key] = [];
            rangeObj.zpwrbSpends[d_key] = [];
        }
        rangeObj.zpwrbSupply.total = [];
        rangeObj.zpwrbMints.total = [];
        rangeObj.zpwrbSpends.total = [];
    } else {
        rangeObj.zpwrbSupply[denom_key] = [];
        rangeObj.zpwrbMints[denom_key] = [];
        rangeObj.zpwrbSpends[denom_key] = [];
    }

    let step = 1;
    if (denom_key == "total") {
        // Limit to ~120 points
        step = 1+Math.floor((bl_to-bl_from) / 120);
    } else {
        // Limit to ~60 points
        step = 1+Math.floor((bl_to-bl_from) / 60);
    }

    // Skip some points. Add total per-block data
    let total_mints = {};
    let total_spends = {};
    for (const denom_key of DENOM_KEYS) {
        total_mints[denom_key] = 0;
        total_spends[denom_key] = 0;
    }
    total_mints["total"] = 0;
    total_spends["total"] = 0;

    for (let i = bl_from; i <= bl_to; i++) {
        //  sum block-range objects such as txes
        if (denom_key == "total") {
            for (const d_key of DENOM_KEYS) {
                total_mints[d_key] += mintsupplydata[d_key][i];
                total_spends[d_key] += spendsupplydata[d_key][i];
            }
            total_mints.total += mintsupplydata.total[i];
            total_spends.total += spendsupplydata.total[i];
        } else {
            total_mints[denom_key] += mintsupplydata[denom_key][i];
            total_spends[denom_key] += spendsupplydata[denom_key][i];
        }

        if (step <= 1 || i % step == 0) {
            // add data to rangeObj
            rangeObj.blocks_axis.push(block_data.blocks_axis[i]);
            rangeObj.time_axis.push(new Date(block_data.time_axis[i]*1000).toLocaleString());
            if (denom_key == "total") {
                for (const d_key of DENOM_KEYS) {
                    rangeObj.zpwrbSupply[d_key].push(zpwrbsupplydata[d_key][i]);
                    rangeObj.zpwrbMints[d_key].push(total_mints[d_key]);
                    rangeObj.zpwrbSpends[d_key].push(total_spends[d_key]);
                    // reset block-range objects sums
                    total_mints[d_key] = 0;
                    total_spends[d_key] = 0;
                }
                rangeObj.zpwrbSupply.total.push(zpwrbsupplydata.total[i]);
                rangeObj.zpwrbMints.total.push(total_mints.total);
                rangeObj.zpwrbSpends.total.push(total_spends.total);
                // reset block-range objects sums
                total_mints.total = 0;
                total_spends.total = 0;
            } else {
                rangeObj.zpwrbSupply[denom_key].push(zpwrbsupplydata[denom_key][i]);
                rangeObj.zpwrbMints[denom_key].push(total_mints[denom_key]);
                rangeObj.zpwrbSpends[denom_key].push(total_spends[denom_key]);
                // reset block-range objects sums
                total_mints[denom_key] = 0;
                total_spends[denom_key] = 0;
            }
        }
    }
    return rangeObj;
}

// sets zpwrbsupplyChart range and updates it
function SetSupplyChartRange(val_from, val_to, denom_key) {
    // get new dataPoints
    const rangeObj = GetSupplyDataPoints(val_from, val_to, denom_key);
    // update chart
    SetDataLabel(supplyChart[denom_key], rangeObj);
    if (denom_key != "total") {
        // single denom chart
        supplyChart[denom_key].data.datasets[0].data = rangeObj.zpwrbSupply[denom_key];
        supplyChart[denom_key].data.datasets[1].data = rangeObj.zpwrbMints[denom_key];
        supplyChart[denom_key].data.datasets[2].data = rangeObj.zpwrbSpends[denom_key];
    } else {
        supplyChart[denom_key].data.datasets[0].data = rangeObj.zpwrbSupply[denom_key];
        supplyChart[denom_key].data.datasets[1].data = rangeObj.zpwrbMints[denom_key];
        supplyChart[denom_key].data.datasets[2].data = rangeObj.zpwrbSpends[denom_key];
        for (let i = 0; i < DENOM_KEYS.length; i++) {
            supplyChart[denom_key].data.datasets[3+i].data = rangeObj.zpwrbSupply[DENOM_KEYS[i]];
        }
    }
    // draw chart
    const canvID = supply_ctx[denom_key].id.substring(0, supply_ctx[denom_key].id.length-4);
    ShowCanvas(canvID);
    supplyChart[denom_key].update()
}

// sets zpwrbamountChart range and updates it
function SetZpwrbAmountChartRange(val_from, val_to) {
    // get new dataPoints
    const rangeObj = GetSupplyDataPoints(val_from, val_to, "total");
    // update chart
    SetDataLabel(zpwrbamountChart, rangeObj);
    for (let i = 0; i < DENOM_KEYS.length; i++) {
        zpwrbamountChart.data.datasets[i].data = rangeObj.zpwrbSupply[DENOM_KEYS[i]].map(
            y => (y / DENOM_VALUES[DENOM_KEYS[i]])
        );
    }
    // draw chart
    const canvID = zpwrbamount_ctx.id.substring(0, zpwrbamount_ctx.id.length-4);
    ShowCanvas(canvID);
    zpwrbamountChart.update()
}

// WINDOWS ON LOAD
window.onload = function () {
    ComputeSpends();
    ComputeTotals();
    InitAllCharts();
}

// --- INIT FUNCTIONS ---

// computes number of spends from supply and number of mints
function ComputeSpends() {
    // first block 0
    for (const denom_key of DENOM_KEYS) {
        spendsupplydata[denom_key] = [0];
    }
    for (let i = 1; i < block_data.blocks_axis.length; i++) {
        for (const denom_key of DENOM_KEYS) {
            let supply_delta = (zpwrbsupplydata[denom_key][i] -
                zpwrbsupplydata[denom_key][i-1]);
            spendsupplydata[denom_key].push((mintsupplydata[denom_key][i] -
                supply_delta/DENOM_VALUES[denom_key])
            );
        }
    }
}

function ComputeTotals() {
    zpwrbsupplydata.total = [];
    mintsupplydata.total = [];
    spendsupplydata.total = [];
    for (let i = 0; i < block_data.blocks_axis.length; i++) {
        zpwrbSupply_total = 0;
        zpwrbMints_total = 0;
        zpwrbSpends_total = 0;
        for (const denom_key of DENOM_KEYS) {
            zpwrbSupply_total += zpwrbsupplydata[denom_key][i];
            zpwrbMints_total += mintsupplydata[denom_key][i];
            zpwrbSpends_total += spendsupplydata[denom_key][i];
        }
        zpwrbsupplydata.total.push(zpwrbSupply_total);
        mintsupplydata.total.push(zpwrbMints_total);
        spendsupplydata.total.push(zpwrbSpends_total);
    }
}

// Initialize charts with whole range
function InitAllCharts() {
    InitSupplyChart('total');
    for (denom_key of DENOM_KEYS) {
        InitSupplyChart(denom_key);
    }
    InitAmountChart();
    InitZPSDoughnut();
}

function InitSupplyChart(denom_key) {
    let legend1 = 'Supply (PWRB)';
    let legend2 = 'Mints / Spends';
    let pointradius = 1;
    if (denom_key == "total") {
        pointradius = 2;
    }
    supplyChart[denom_key] = InitBarChart(supply_ctx[denom_key], [legend1, legend2]);
    supplyChart[denom_key].options.tooltips.callbacks.title = tooltipTitle;
    supplyChart[denom_key].data.labelset = "blocks"
    supplyChart[denom_key].data.datasets = [
        {
            data: [],
            label: "zPWRB supply",
            borderColor: DENOM_COLORS[denom_key],
            pointRadius: pointradius,
            fill: false,
            type: 'line',
            yAxisID: 'axis0'
        },
        {
            data: [],
            label: "Mints",
            yAxisID: 'axis1',
            borderColor: MINT_COLOR[0],
            backgroundColor: MINT_COLOR[1],
            borderWidth: 1
        },
        {
            data: [],
            label: "Spends",
            yAxisID: 'axis1',
            borderColor: SPEND_COLOR[0],
            backgroundColor: SPEND_COLOR[1],
            borderWidth: 1
        }
    ];

    supplyChart[denom_key].options.onResize = (chart, size) => MinimizeChartLegend(chart, size, 350);

    if (denom_key == "total") {
        supplyChart[denom_key].data.datasets = [].concat(
            supplyChart[denom_key].data.datasets,
            DENOM_KEYS.map((x, index) => (
                {
                    data: [],
                    label: x,
                    borderColor: DENOM_COLORS[x],
                    pointRadius: 2,
                    needsRadius: 2,   // for resize,
                    fill: false,
                    type: 'line',
                    yAxisID: 'axis0',
                    hidden: true
                }
            ))
        );
        supplyChart[denom_key].options.legend.position = 'right';
        supplyChart[denom_key].options.legend.origPosition = 'right';
        supplyChart[denom_key].options.onResize = MinimizeChartLegend;
    }
    AddSupplyToolTip(supplyChart[denom_key]);
    SetSupplyChartRange(1, (block_data.blocks_axis.length - 1), denom_key);
}

function InitAmountChart() {
    let legend1 = 'No. of coins';
    zpwrbamountChart = InitLineChart(zpwrbamount_ctx, [legend1]);
    zpwrbamountChart.options.tooltips.callbacks.title = tooltipTitle;
    zpwrbamountChart.data.labelset = "blocks"
    zpwrbamountChart.data.datasets = DENOM_KEYS.map((x, index) => (
        {
            data: [],
            label: x,
            borderColor: DENOM_COLORS[x],
            pointRadius: 1,
            fill: false,
            yAxisID: 'axis0'
        }
    ));
    zpwrbamountChart.options.onResize = (chart, size) => MinimizeChartLegend(chart, size, 500);
    SetZpwrbAmountChartRange(1, (block_data.blocks_axis.length - 1));
}

function InitZPSDoughnut() {
    zpwrbsupplynowChart = InitDoughnutChart(zpwrbsupplynow_ctx);
    const rangeObj = GetSupplyDataPoints((block_data.blocks_axis.length - 1), (block_data.blocks_axis.length - 1), "total");
    let len = rangeObj.zpwrbSupply[DENOM_KEYS[0]].length;
    zpwrbsupplynowChart.data.datasets = [
        {
            data: DENOM_KEYS.map(x => (rangeObj.zpwrbSupply[x][len-1]/DENOM_VALUES[x])),
            borderColor: DENOM_KEYS.map(x => DENOM_COLORS[x]),
            backgroundColor: DENOM_KEYS.map(x => DENOM_COLORS2[x])
        }
    ];
    zpwrbsupplynowChart.data.labels = DENOM_KEYS;
    zpwrbsupplynowChart.update()
}

// map elements ID of canvas headers to right 'SetChartRange' function
function MapIdToSetChartRange(canv_id, val_from, val_to) {
    switch(canv_id) {
        case "canv_supply_01":
            return SetSupplyChartRange(val_from, val_to, "total");
        case "canv_supply_02":
            return SetZpwrbAmountChartRange(val_from, val_to);
        case "canv_supply_03":
            return SetSupplyChartRange(val_from, val_to, "denom_1");
        case "canv_supply_04":
            return SetSupplyChartRange(val_from, val_to, "denom_5");
        case "canv_supply_05":
            return SetSupplyChartRange(val_from, val_to, "denom_10");
        case "canv_supply_06":
            return SetSupplyChartRange(val_from, val_to, "denom_50");
        case "canv_supply_07":
            return SetSupplyChartRange(val_from, val_to, "denom_100");
        case "canv_supply_08":
            return SetSupplyChartRange(val_from, val_to, "denom_500");
        case "canv_supply_09":
            return SetSupplyChartRange(val_from, val_to, "denom_1000");
        case "canv_supply_10":
            return SetSupplyChartRange(val_from, val_to, "denom_5000");
        default:
            alert(canv_id + " not found");
            return;
    }
}

// map elements ID of canvas headers to right chart
function MapIdToChart(canv_id) {
    switch(canv_id) {
        case "canv_supply_01":
            return supplyChart.total;
        case "canv_supply_02":
            return zpwrbamountChart;
        case "canv_supply_03":
            return supplyChart.denom_1;
        case "canv_supply_04":
            return supplyChart.denom_5;
        case "canv_supply_05":
            return supplyChart.denom_10;
        case "canv_supply_06":
            return supplyChart.denom_50;
        case "canv_supply_07":
            return supplyChart.denom_100;
        case "canv_supply_08":
            return supplyChart.denom_500;
        case "canv_supply_09":
            return supplyChart.denom_1000;
        case "canv_supply_10":
            return supplyChart.denom_5000;
        default:
            return supplyChart.total;
    }
};
