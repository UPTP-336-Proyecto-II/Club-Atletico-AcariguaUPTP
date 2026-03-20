<template>
  <el-table :data="list" style="width: 100%;padding-top: 15px;">
    <el-table-column label="Order_No" min-width="200">
      <template #default="scope">
        {{ orderNoFilter(scope.row.order_no) }}
      </template>
    </el-table-column>
    <el-table-column label="Price" width="195" align="center">
      <template #default="scope">
        ¥{{ toThousandFilter(scope.row.price) }}
      </template>
    </el-table-column>
    <el-table-column label="Status" width="100" align="center">
      <template #default="{row}">
        <el-tag :type="statusFilter(row.status)">
          {{ row.status }}
        </el-tag>
      </template>
    </el-table-column>
  </el-table>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { transactionList } from '@/api/remote-search'

const list = ref([])

const statusFilter = (status) => {
  const statusMap = {
    success: 'success',
    pending: 'danger'
  }
  return statusMap[status]
}

const orderNoFilter = (str) => {
  return str.substring(0, 30)
}

const toThousandFilter = (num) => {
  return (+num || 0).toString().replace(/^-?\d+/g, m => m.replace(/(?=(?!\b)(\d{3})+$)/g, ','))
}

const fetchData = async () => {
  try {
    const response = await transactionList()
    list.value = response.data.items.slice(0, 8)
  } catch (error) {
    console.error(error)
  }
}

onMounted(() => {
  fetchData()
})
</script>
