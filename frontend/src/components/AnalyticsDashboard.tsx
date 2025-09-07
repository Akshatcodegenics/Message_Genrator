import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { storageService, Analytics } from '../services/storageService';
// Using emoji instead of react-icons for better compatibility

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  subtitle: string;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon, title, value, subtitle, color }) => (
  <motion.div 
    className={`stat-card ${color}`}
    whileHover={{ scale: 1.05, y: -5 }}
    whileTap={{ scale: 0.95 }}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
  >
    <div className="stat-icon">{icon}</div>
    <div className="stat-content">
      <div className="stat-value">{value}</div>
      <div className="stat-title">{title}</div>
      <div className="stat-subtitle">{subtitle}</div>
    </div>
  </motion.div>
);

const AnalyticsDashboard: React.FC = () => {
  const [analytics, setAnalytics] = useState<Analytics>({
    totalMessagesGenerated: 0,
    categoryCounts: {},
    dailyUsage: {},
    mostUsedTemplates: {},
    lastUpdated: new Date().toISOString()
  });

  const [storageUsage, setStorageUsage] = useState({ used: 0, total: 0, percentage: 0 });

  useEffect(() => {
    const loadAnalytics = () => {
      try {
        const data = storageService.getAnalytics();
        const usage = storageService.getStorageUsage();
        setAnalytics(data);
        setStorageUsage(usage);
      } catch (error) {
        console.error('Error loading analytics:', error);
      }
    };

    loadAnalytics();
    
    // Refresh analytics every 30 seconds
    const interval = setInterval(loadAnalytics, 30000);
    return () => clearInterval(interval);
  }, []);

  // Prepare chart data
  const categoryChartData = {
    labels: Object.keys(analytics.categoryCounts),
    datasets: [
      {
        label: 'Messages by Category',
        data: Object.values(analytics.categoryCounts),
        backgroundColor: [
          '#2563eb',
          '#10b981',
          '#f59e0b',
          '#8b5cf6',
          '#ef4444',
          '#06b6d4'
        ],
        borderColor: [
          '#1d4ed8',
          '#059669',
          '#d97706',
          '#7c3aed',
          '#dc2626',
          '#0891b2'
        ],
        borderWidth: 2,
      },
    ],
  };

  const templateChartData = {
    labels: Object.keys(analytics.mostUsedTemplates).slice(0, 5),
    datasets: [
      {
        label: 'Template Usage',
        data: Object.values(analytics.mostUsedTemplates).slice(0, 5),
        backgroundColor: 'rgba(37, 99, 235, 0.6)',
        borderColor: '#2563eb',
        borderWidth: 2,
        borderRadius: 8,
      },
    ],
  };

  // Prepare daily usage data for the last 7 days
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - i);
    return date.toISOString().split('T')[0];
  }).reverse();

  const dailyUsageData = {
    labels: last7Days.map(date => {
      const d = new Date(date);
      return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    }),
    datasets: [
      {
        label: 'Daily Messages',
        data: last7Days.map(date => analytics.dailyUsage[date] || 0),
        fill: true,
        backgroundColor: 'rgba(16, 185, 129, 0.2)',
        borderColor: '#10b981',
        pointBackgroundColor: '#10b981',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 6,
        tension: 0.4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: 'rgba(255, 255, 255, 0.2)',
        borderWidth: 1,
        cornerRadius: 8,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#6b7280',
          fontSize: 12,
        },
      },
      y: {
        grid: {
          color: 'rgba(107, 114, 128, 0.1)',
        },
        ticks: {
          color: '#6b7280',
          fontSize: 12,
        },
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: 20,
          color: '#374151',
          fontSize: 12,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: 'rgba(255, 255, 255, 0.2)',
        borderWidth: 1,
        cornerRadius: 8,
      },
    },
    cutout: '60%',
  };

  const getMostActiveDay = () => {
    const sortedDays = Object.entries(analytics.dailyUsage)
      .sort(([,a], [,b]) => b - a);
    
    if (sortedDays.length === 0) return 'No data';
    
    const [date, count] = sortedDays[0];
    const formattedDate = new Date(date).toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'short', 
      day: 'numeric' 
    });
    
    return `${formattedDate} (${count} messages)`;
  };

  const getAverageDaily = () => {
    const values = Object.values(analytics.dailyUsage);
    if (values.length === 0) return '0';
    
    const average = values.reduce((sum, val) => sum + val, 0) / values.length;
    return average.toFixed(1);
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <motion.div 
      className="analytics-dashboard"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="dashboard-header">
        <h2>
📊
          Analytics Dashboard
        </h2>
        <span className="last-updated">
          Last updated: {new Date(analytics.lastUpdated).toLocaleString()}
        </span>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <StatCard
          icon={<span style={{fontSize: '2rem'}}>💬</span>}
          title="Total Messages"
          value={analytics.totalMessagesGenerated}
          subtitle="Generated so far"
          color="blue"
        />
        <StatCard
          icon={<span style={{fontSize: '2rem'}}>🎯</span>}
          title="Categories Used"
          value={Object.keys(analytics.categoryCounts).length}
          subtitle="Different types"
          color="green"
        />
        <StatCard
          icon={<span style={{fontSize: '2rem'}}>⏰</span>}
          title="Daily Average"
          value={getAverageDaily()}
          subtitle="Messages per day"
          color="orange"
        />
        <StatCard
          icon={<span style={{fontSize: '2rem'}}>📊</span>}
          title="Storage Used"
          value={`${storageUsage.percentage}%`}
          subtitle={formatBytes(storageUsage.used)}
          color="purple"
        />
      </div>

      {/* Charts Grid */}
      <div className="charts-grid">
        {/* Daily Usage Chart */}
        <motion.div 
          className="chart-card"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="chart-header">
            <h3>Daily Usage (Last 7 Days)</h3>
            <span className="chart-subtitle">Message generation over time</span>
          </div>
          <div className="chart-container">
            <Line data={dailyUsageData} options={chartOptions} />
          </div>
        </motion.div>

        {/* Category Distribution Chart */}
        <motion.div 
          className="chart-card"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <div className="chart-header">
            <h3>Category Distribution</h3>
            <span className="chart-subtitle">Messages by category</span>
          </div>
          <div className="chart-container">
            {Object.keys(analytics.categoryCounts).length > 0 ? (
              <Doughnut data={categoryChartData} options={doughnutOptions} />
            ) : (
              <div className="no-data">
                <span>📊</span>
                <p>No category data available</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Template Usage Chart */}
        <motion.div 
          className="chart-card full-width"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <div className="chart-header">
            <h3>Most Used Templates</h3>
            <span className="chart-subtitle">Top 5 templates by usage</span>
          </div>
          <div className="chart-container">
            {Object.keys(analytics.mostUsedTemplates).length > 0 ? (
              <Bar data={templateChartData} options={chartOptions} />
            ) : (
              <div className="no-data">
                <span>📈</span>
                <p>No template data available</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Additional Stats */}
      <motion.div 
        className="additional-stats"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.8 }}
      >
        <div className="stat-item">
          <span className="stat-label">Most Active Day:</span>
          <span className="stat-value">{getMostActiveDay()}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Storage Health:</span>
          <div className="storage-bar">
            <div 
              className="storage-fill" 
              style={{ width: `${Math.min(storageUsage.percentage, 100)}%` }}
            />
            <span className="storage-text">
              {formatBytes(storageUsage.used)} / {formatBytes(storageUsage.total)}
            </span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default AnalyticsDashboard;
