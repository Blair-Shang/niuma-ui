# RsTable 图表适配（库无关 → ECharts）

内核只产出 `RsTableChartSeries`；**不捆绑 echarts**。官方提供纯映射函数，业务自行 `setOption`。

## 快速接入

```ts
import {
  createChartSeriesTableFeature,
  mapRsTableSeriesToEChartsOption,
} from 'niuma-ui'
import * as echarts from 'echarts' // 宿主依赖

let chart: echarts.ECharts | null = null

const features = [
  createChartSeriesTableFeature({
    seriesDefs: [
      { id: 'by-status', kind: 'bar', categoryField: 'status', valueAgg: 'count' },
    ],
    onSeries(series) {
      const option = mapRsTableSeriesToEChartsOption(series)
      chart?.setOption(option, true)
    },
  }),
]
```

```vue
<RsTable :columns="columns" :data="rows" row-key="id" selectable :features="features" />
<div ref="chartEl" class="chart-host" />
```

```ts
onMounted(() => {
  chart = echarts.init(chartEl.value!)
})
```

## 无头预计算

```ts
const { api } = useRsTableHeadless({
  columns: () => columns,
  data: () => rows,
  features: () => [
    createChartSeriesTableFeature({
      seriesDefs: [{ id: 'pie', kind: 'pie', categoryField: 'status' }],
      onSeries(series, snap) {
        // 可序列化后下发给客户端图表
        payload.value = mapRsTableSeriesToEChartsOption(series)
        void snap
      },
    }),
  ],
})
```

## 约定

| 项 | 说明 |
|---|---|
| 分类轴 | 多系列默认共用首系列 `categories` |
| 饼图 | `tooltip.trigger=item`，`data: {name,value}[]` |
| 选中联动 | Feature 订阅 analytics；`sourceRows` 已是「选中优先」 |

完整架构见 [rs-table-architecture.md](./rs-table-architecture.md)。
