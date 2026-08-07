'use client';

import { useState } from "react";
import Link from "next/link";
import {
  TrendingUp,
  TrendingDown,
  Search,
  Filter,
  Download,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileText,
  CheckCircle2,
  Package,
  Truck,
  Clock,
  XCircle,
  Share2,
} from "lucide-react";

// Mock Recent Orders Data matching reference screenshot exactly
const INITIAL_ORDERS = [
  {
    id: "ORD-9021",
    customerName: "Liam Martinez",
    itemDescription: "Wireless Headphones - Black",
    salesChannel: "Amazon",
    orderDate: "04/25/2026",
    amount: "$89.99",
    status: "Shipped",
    statusColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  {
    id: "ORD-9022",
    customerName: "Noah Kim",
    itemDescription: "Hardcover Novel - Mystery",
    salesChannel: "Website",
    orderDate: "04/23/2026",
    amount: "$22.00",
    status: "Out for Delivery",
    statusColor: "bg-blue-50 text-blue-700 border-blue-200",
  },
  {
    id: "ORD-9023",
    customerName: "Emma Johnson",
    itemDescription: "LED Desk Lamp - Adjustable",
    salesChannel: "Etsy",
    orderDate: "04/24/2026",
    amount: "$45.50",
    status: "Processing",
    statusColor: "bg-amber-50 text-amber-700 border-amber-200",
  },
  {
    id: "ORD-9024",
    customerName: "John Abraham",
    itemDescription: "100M Leads by Alex Hormozi",
    salesChannel: "Website",
    orderDate: "04/23/2026",
    amount: "$22.00",
    status: "Out for Delivery",
    statusColor: "bg-blue-50 text-blue-700 border-blue-200",
  },
  {
    id: "ORD-9025",
    customerName: "Sophia Lee",
    itemDescription: "Yoga Mat - Blue",
    salesChannel: "Amazon",
    orderDate: "04/22/2026",
    amount: "$30.00",
    status: "Cancelled",
    statusColor: "bg-rose-50 text-rose-700 border-rose-200",
  },
  {
    id: "ORD-9026",
    customerName: "Ethan Davis",
    itemDescription: "Livus Apex Jersey - Oversized Black",
    salesChannel: "Website",
    orderDate: "04/21/2026",
    amount: "$120.00",
    status: "Delivered",
    statusColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  {
    id: "ORD-9027",
    customerName: "Olivia Wilson",
    itemDescription: "LIVUS Vintage Heavyweight Hoodie",
    salesChannel: "Instagram",
    orderDate: "04/20/2026",
    amount: "$145.00",
    status: "Shipped",
    statusColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  {
    id: "ORD-9028",
    customerName: "Mason Taylor",
    itemDescription: "Classic Cotton Crewneck Tee",
    salesChannel: "TikTok Store",
    orderDate: "04/19/2026",
    amount: "$48.00",
    status: "Processing",
    statusColor: "bg-amber-50 text-amber-700 border-amber-200",
  },
  {
    id: "ORD-9029",
    customerName: "Ava Anderson",
    itemDescription: "Minimalist Leather Cardholder",
    salesChannel: "Website",
    orderDate: "04/18/2026",
    amount: "$65.00",
    status: "Delivered",
    statusColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
];

// Revenue Chart Days Data
const REVENUE_CHART_DATA = [
  { day: "13 Jul", revenue: 12000, expense: 19000 },
  { day: "14 Jul", revenue: 18000, expense: 22000 },
  { day: "15 Jul", revenue: 31000, expense: 15000 },
  { day: "16 Jul", revenue: 26532, expense: 20341, highlighted: true },
  { day: "17 Jul", revenue: 24000, expense: 18000 },
  { day: "18 Jul", revenue: 27000, expense: 17000 },
  { day: "19 Jul", revenue: 41000, expense: 9500 },
];

export default function AdminDashboardPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [recordsPerPage, setRecordsPerPage] = useState(9);
  const [currentPage, setCurrentPage] = useState(1);
  const [hoveredDataPoint, setHoveredDataPoint] = useState<typeof REVENUE_CHART_DATA[0] | null>(
    REVENUE_CHART_DATA.find((d) => d.highlighted) || REVENUE_CHART_DATA[3]
  );

  // Filter orders by search query
  const filteredOrders = INITIAL_ORDERS.filter((order) =>
    order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.itemDescription.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.salesChannel.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.status.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleSelectAll = () => {
    if (selectedOrders.length === filteredOrders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(filteredOrders.map((o) => o.id));
    }
  };

  const toggleSelectOrder = (id: string) => {
    if (selectedOrders.includes(id)) {
      setSelectedOrders(selectedOrders.filter((item) => item !== id));
    } else {
      setSelectedOrders([...selectedOrders, id]);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6 min-h-screen bg-[#fafafa] text-neutral-900 font-sans">

      {/* TOP SECTION: 4 KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        {/* KPI Card 1: Total Sales */}
        <div className="bg-white p-5 border border-neutral-200/80 rounded-xl shadow-xs flex flex-col justify-between">
          <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
            Total Sales
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold tracking-tight text-neutral-900 font-mono">
              2,274
            </span>
          </div>
          <div className="mt-2 flex items-center gap-1 text-xs font-medium text-emerald-600">
            <span className="inline-flex items-center gap-0.5 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-200">
              <TrendingUp className="size-3 text-emerald-600" />
              +1.3%
            </span>
            <span className="text-neutral-400 font-normal">last 7 days</span>
          </div>
        </div>

        {/* KPI Card 2: Total Orders */}
        <div className="bg-white p-5 border border-neutral-200/80 rounded-xl shadow-xs flex flex-col justify-between">
          <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
            Total Orders
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold tracking-tight text-neutral-900 font-mono">
              4,818
            </span>
          </div>
          <div className="mt-2 flex items-center gap-1 text-xs font-medium text-emerald-600">
            <span className="inline-flex items-center gap-0.5 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-200">
              <TrendingUp className="size-3 text-emerald-600" />
              +0.7%
            </span>
            <span className="text-neutral-400 font-normal">last 7 days</span>
          </div>
        </div>

        {/* KPI Card 3: Total Returns */}
        <div className="bg-white p-5 border border-neutral-200/80 rounded-xl shadow-xs flex flex-col justify-between">
          <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
            Total Returns
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold tracking-tight text-neutral-900 font-mono">
              243
            </span>
          </div>
          <div className="mt-2 flex items-center gap-1 text-xs font-medium text-rose-600">
            <span className="inline-flex items-center gap-0.5 bg-rose-50 px-1.5 py-0.5 rounded-md border border-rose-200">
              <TrendingUp className="size-3 text-rose-600" />
              +1.3%
            </span>
            <span className="text-neutral-400 font-normal">last 7 days</span>
          </div>
        </div>

        {/* KPI Card 4: Conversion Rates */}
        <div className="bg-white p-5 border border-neutral-200/80 rounded-xl shadow-xs flex flex-col justify-between">
          <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
            Conversion Rates
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold tracking-tight text-neutral-900 font-mono">
              6.32%
            </span>
          </div>
          <div className="mt-2 flex items-center gap-1 text-xs font-medium text-emerald-600">
            <span className="inline-flex items-center gap-0.5 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-200">
              <TrendingUp className="size-3 text-emerald-600" />
              +0.2%
            </span>
            <span className="text-neutral-400 font-normal">last 7 days</span>
          </div>
        </div>

      </div>

      {/* MIDDLE SECTION: Revenue Chart + Social Impressions Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* LEFT 2/3 COLUMN: Total Revenue Interactive Dual-Line Chart */}
        <div className="lg:col-span-2 bg-white p-6 border border-neutral-200/80 rounded-xl shadow-xs flex flex-col justify-between relative">
          
          {/* Chart Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                Total Revenue
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-2xl font-extrabold tracking-tight text-neutral-900 font-mono">
                  $38,274
                </span>
                <span className="inline-flex items-center gap-0.5 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-600 rounded-md border border-emerald-200">
                  <TrendingUp className="size-3" />
                  +1.3%
                </span>
                <span className="text-xs text-neutral-400">last 7 days</span>
              </div>
            </div>

            {/* Chart Legend */}
            <div className="flex items-center gap-4 text-xs font-medium text-neutral-600">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span>Revenue</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span>Expense</span>
              </div>
            </div>
          </div>

          {/* SVG Line Chart Canvas */}
          <div className="relative w-full h-[260px] flex items-end">

            {/* Y-Axis Grid Lines & Labels */}
            <div className="absolute inset-0 flex flex-col justify-between text-[11px] font-mono text-neutral-400 pointer-events-none">
              <div className="border-b border-dashed border-neutral-100 pb-1">45k</div>
              <div className="border-b border-dashed border-neutral-100 pb-1">32k</div>
              <div className="border-b border-dashed border-neutral-100 pb-1">24k</div>
              <div className="border-b border-dashed border-neutral-100 pb-1">16k</div>
              <div className="border-b border-dashed border-neutral-100 pb-1">0</div>
            </div>

            {/* SVG Line Paths (Revenue & Expense) */}
            <svg className="w-full h-[200px] overflow-visible z-10" viewBox="0 0 700 200" preserveAspectRatio="none">
              {/* Dotted Vertical Guide line for 16 Jul */}
              <line x1="350" y1="0" x2="350" y2="200" stroke="#e5e5e5" strokeDasharray="3 3" strokeWidth="1.5" />

              {/* Expense Line Path (Orange/Amber) */}
              <path
                d="M 10 120 Q 110 80, 210 130 T 350 110 T 490 130 T 690 160"
                fill="none"
                stroke="#f59e0b"
                strokeWidth="2.5"
                strokeLinecap="round"
              />

              {/* Revenue Line Path (Emerald Green) */}
              <path
                d="M 10 160 Q 110 120, 210 50 T 350 80 T 490 60 T 690 15"
                fill="none"
                stroke="#10b981"
                strokeWidth="2.5"
                strokeLinecap="round"
              />

              {/* Data points on 16 Jul */}
              <circle cx="350" cy="80" r="5" fill="#10b981" stroke="#ffffff" strokeWidth="2" />
              <circle cx="350" cy="110" r="5" fill="#f59e0b" stroke="#ffffff" strokeWidth="2" />
            </svg>

            {/* Hover Tooltip Card (Exact match to screenshot) */}
            <div
              className="absolute left-[50%] top-[25%] -translate-x-[50%] bg-white border border-neutral-200 shadow-lg rounded-lg p-3 z-20 font-sans"
              style={{ width: "160px" }}
            >
              <div className="text-xs font-bold text-neutral-800 border-b border-neutral-100 pb-1 mb-1.5">
                {hoveredDataPoint?.day || "16 Jul"}, 2026
              </div>
              <div className="text-[12px] text-neutral-600 flex justify-between items-center font-mono">
                <span className="text-neutral-500 font-sans">Revenue:</span>
                <span className="font-semibold text-emerald-600">$26,532</span>
              </div>
              <div className="text-[12px] text-neutral-600 flex justify-between items-center font-mono mt-0.5">
                <span className="text-neutral-500 font-sans">Expense:</span>
                <span className="font-semibold text-amber-600">$20,341</span>
              </div>
            </div>
          </div>

          {/* X-Axis Date Labels */}
          <div className="flex justify-between text-xs text-neutral-400 font-mono mt-4 pt-2 border-t border-neutral-100">
            {REVENUE_CHART_DATA.map((item) => (
              <span
                key={item.day}
                onMouseEnter={() => setHoveredDataPoint(item)}
                className={`cursor-pointer transition-colors ${item.day === (hoveredDataPoint?.day || "16 Jul") ? "text-neutral-900 font-bold" : "hover:text-neutral-700"}`}
              >
                {item.day}
              </span>
            ))}
          </div>

        </div>

        {/* RIGHT 1/3 COLUMN: Total Impressions & Social Breakdown */}
        <div className="bg-white p-6 border border-neutral-200/80 rounded-xl shadow-xs flex flex-col justify-between">
          <div>
            <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              Total Impressions
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-2xl font-extrabold tracking-tight text-neutral-900 font-mono">
                275k
              </span>
              <span className="inline-flex items-center gap-0.5 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-600 rounded-md border border-emerald-200">
                <TrendingUp className="size-3" />
                +1.3%
              </span>
              <span className="text-xs text-neutral-400">last 7 days</span>
            </div>

            {/* Social Proportion Segmented Color Bar */}
            <div className="mt-4 flex h-3 w-full rounded-full overflow-hidden gap-0.5">
              <div className="bg-blue-600 h-full" style={{ width: "46%" }} title="Facebook (46%)" />
              <div className="bg-rose-500 h-full" style={{ width: "22%" }} title="Instagram (22%)" />
              <div className="bg-amber-400 h-full" style={{ width: "8%" }} title="X (8%)" />
              <div className="bg-indigo-600 h-full" style={{ width: "6%" }} title="LinkedIn (6%)" />
              <div className="bg-purple-600 h-full" style={{ width: "3%" }} title="Threads (3%)" />
              <div className="bg-neutral-200 h-full" style={{ width: "15%" }} title="Direct (15%)" />
            </div>

            {/* Social Channels Legend Bar */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-[11px] text-neutral-500 font-medium">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-600" /> Facebook</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500" /> Instagram</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400" /> X</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-indigo-600" /> LinkedIn</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-600" /> Threads</span>
            </div>
          </div>

          {/* Social Channels Breakdown List */}
          <div className="mt-6 flex flex-col gap-3.5 border-t border-neutral-100 pt-4">
            
            {/* Facebook */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm">
                  f
                </div>
                <span className="text-sm font-semibold text-neutral-800">Facebook</span>
              </div>
              <div className="text-xs text-neutral-500 font-mono">
                <span className="font-bold text-neutral-900">162.4k</span> <span className="text-neutral-400">(46%)</span>
              </div>
            </div>

            {/* Instagram */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-sm">
                  📷
                </div>
                <span className="text-sm font-semibold text-neutral-800">Instagram</span>
              </div>
              <div className="text-xs text-neutral-500 font-mono">
                <span className="font-bold text-neutral-900">32.6K</span> <span className="text-neutral-400">(22%)</span>
              </div>
            </div>

            {/* X (Twitter) */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-neutral-900 text-white flex items-center justify-center font-bold text-xs">
                  𝕏
                </div>
                <span className="text-sm font-semibold text-neutral-800">X</span>
              </div>
              <div className="text-xs text-neutral-500 font-mono">
                <span className="font-bold text-neutral-900">12.7K</span> <span className="text-neutral-400">(8%)</span>
              </div>
            </div>

            {/* LinkedIn */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
                  in
                </div>
                <span className="text-sm font-semibold text-neutral-800">LinkedIn</span>
              </div>
              <div className="text-xs text-neutral-500 font-mono">
                <span className="font-bold text-neutral-900">4.9K</span> <span className="text-neutral-400">(6%)</span>
              </div>
            </div>

            {/* Threads */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-xs">
                  @
                </div>
                <span className="text-sm font-semibold text-neutral-800">Threads</span>
              </div>
              <div className="text-xs text-neutral-500 font-mono">
                <span className="font-bold text-neutral-900">1.8K</span> <span className="text-neutral-400">(3%)</span>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* BOTTOM SECTION: Recent Orders Table Card (Exact match to reference screenshot) */}
      <div className="bg-white border border-neutral-200/80 rounded-xl shadow-xs overflow-hidden flex flex-col">
        
        {/* Table Controls Header */}
        <div className="p-5 border-b border-neutral-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-lg font-bold text-neutral-900 tracking-tight">
            Recent Orders
          </h2>

          <div className="flex items-center gap-2.5">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-neutral-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-1.5 bg-neutral-50 border border-neutral-200 rounded-lg text-xs font-sans text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-400 transition-colors w-48"
              />
            </div>

            {/* Filters Button */}
            <button
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-neutral-200 rounded-lg text-xs font-medium text-neutral-700 hover:bg-neutral-50 transition-colors cursor-pointer"
            >
              <Filter className="size-3.5 text-neutral-500" />
              <span>Filters</span>
            </button>

            {/* Export All Button */}
            <button
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-neutral-200 rounded-lg text-xs font-medium text-neutral-700 hover:bg-neutral-50 transition-colors cursor-pointer"
            >
              <Download className="size-3.5 text-neutral-500" />
              <span>Export all</span>
            </button>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-neutral-50/80 border-b border-neutral-100 text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
                <th className="py-3 px-4 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={selectedOrders.length === filteredOrders.length && filteredOrders.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-neutral-300 text-neutral-900 focus:ring-0 cursor-pointer"
                  />
                </th>
                <th className="py-3 px-4">Customer Name</th>
                <th className="py-3 px-4">Item Description</th>
                <th className="py-3 px-4">Sales Channel</th>
                <th className="py-3 px-4">Order Date</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Order Status</th>
                <th className="py-3 px-4 text-center">Modify</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 text-xs text-neutral-700">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-neutral-400 font-sans">
                    No matching orders found.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const isSelected = selectedOrders.includes(order.id);
                  return (
                    <tr
                      key={order.id}
                      className={`hover:bg-neutral-50/60 transition-colors ${isSelected ? "bg-neutral-50" : ""}`}
                    >
                      {/* Checkbox */}
                      <td className="py-3.5 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectOrder(order.id)}
                          className="rounded border-neutral-300 text-neutral-900 focus:ring-0 cursor-pointer"
                        />
                      </td>

                      {/* Customer Name */}
                      <td className="py-3.5 px-4 font-bold text-neutral-900">
                        {order.customerName}
                      </td>

                      {/* Item Description */}
                      <td className="py-3.5 px-4 text-neutral-600 max-w-xs truncate">
                        {order.itemDescription}
                      </td>

                      {/* Sales Channel */}
                      <td className="py-3.5 px-4 text-neutral-500 font-medium">
                        {order.salesChannel}
                      </td>

                      {/* Order Date */}
                      <td className="py-3.5 px-4 font-mono text-neutral-500">
                        {order.orderDate}
                      </td>

                      {/* Amount */}
                      <td className="py-3.5 px-4 font-bold text-neutral-900 font-mono">
                        {order.amount}
                      </td>

                      {/* Order Status Pill */}
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${order.statusColor}`}>
                          {order.status}
                        </span>
                      </td>

                      {/* Modify Dropdown Menu */}
                      <td className="py-3.5 px-4 text-center relative">
                        <button
                          type="button"
                          onClick={() => setActiveDropdown(activeDropdown === order.id ? null : order.id)}
                          className="p-1 hover:bg-neutral-100 rounded-md transition-colors text-neutral-400 hover:text-neutral-700 cursor-pointer"
                        >
                          <MoreVertical className="size-4" />
                        </button>

                        {/* Dropdown Menu */}
                        {activeDropdown === order.id && (
                          <div className="absolute right-4 top-10 bg-white border border-neutral-200 shadow-lg rounded-lg py-1.5 w-40 z-30 text-left font-sans text-xs">
                            <Link
                              href="/admin/orders"
                              className="flex items-center gap-2 px-3 py-1.5 text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900"
                            >
                              <Eye className="size-3.5 text-neutral-400" />
                              <span>View Order</span>
                            </Link>
                            <button
                              type="button"
                              onClick={() => {
                                alert(`Updating status for ${order.id}`);
                                setActiveDropdown(null);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-1.5 text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900 cursor-pointer"
                            >
                              <Package className="size-3.5 text-neutral-400" />
                              <span>Update Status</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                alert(`Generating PDF Packing Slip for ${order.id}`);
                                setActiveDropdown(null);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-1.5 text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900 cursor-pointer"
                            >
                              <FileText className="size-3.5 text-neutral-400" />
                              <span>Print Invoice</span>
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer Controls */}
        <div className="p-4 border-t border-neutral-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs font-sans">
          
          {/* Records per page selector */}
          <div className="flex items-center gap-2 text-neutral-500">
            <span>Showing</span>
            <select
              value={recordsPerPage}
              onChange={(e) => setRecordsPerPage(Number(e.target.value))}
              className="bg-neutral-50 border border-neutral-200 rounded px-2 py-1 text-xs text-neutral-800 focus:outline-none cursor-pointer"
            >
              <option value={9}>9</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
            <span>of 134 records</span>
          </div>

          {/* Page Selector Buttons */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(currentPage - 1)}
              className="p-1.5 border border-neutral-200 rounded hover:bg-neutral-50 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronLeft className="size-3.5" />
            </button>
            <button
              type="button"
              className="px-2.5 py-1 bg-emerald-700 text-white font-medium rounded text-xs"
            >
              1
            </button>
            <button
              type="button"
              className="px-2.5 py-1 hover:bg-neutral-100 text-neutral-600 font-medium rounded text-xs transition-colors"
            >
              2
            </button>
            <span className="px-1 text-neutral-400">...</span>
            <button
              type="button"
              className="px-2.5 py-1 hover:bg-neutral-100 text-neutral-600 font-medium rounded text-xs transition-colors"
            >
              12
            </button>
            <button
              type="button"
              className="px-2.5 py-1 hover:bg-neutral-100 text-neutral-600 font-medium rounded text-xs transition-colors"
            >
              13
            </button>
            <button
              type="button"
              onClick={() => setCurrentPage(currentPage + 1)}
              className="p-1.5 border border-neutral-200 rounded hover:bg-neutral-50 cursor-pointer"
            >
              <ChevronRight className="size-3.5" />
            </button>
          </div>

        </div>

      </div>

    </div>
  );
}
