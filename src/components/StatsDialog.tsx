import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography } from "@mui/material";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { useEffect, useState } from 'react';
import axios from 'axios';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#e57373', '#64b5f6', '#81c784', '#ba68c8', '#4db6ac', '#ff8a65', '#7986cb', '#fff176', '#a1887f'];
const API_BASE_URL = 'http://localhost:3001/api';

interface ModelStats {
  total: number;
  byFile: Record<number, number>;
}

interface StatsDialogProps {
  open: boolean;
  onClose: () => void;
  stats: Record<string, ModelStats> | null;
}

export const StatsDialog = ({ open, onClose, stats: allStats }: StatsDialogProps) => {
  const [userStats, setUserStats] = useState<Record<string, ModelStats> | null>(null);
  const currentUser = localStorage.getItem('userName') || '';

  useEffect(() => {
    const fetchUserStats = async () => {
      if (open && currentUser) {
        try {
          const response = await axios.get(`${API_BASE_URL}/state/stats/${currentUser}/models`);
          setUserStats(response.data);
        } catch (error) {
          console.error('Failed to fetch user stats:', error);
        }
      }
    };

    fetchUserStats();
  }, [open, currentUser]);

  if (!allStats) return null;

  // Calculate stats for all users
  const totalComparisons = Object.values(allStats).reduce((sum, model) => sum + model.total, 0);
  const allUsersChartData = Object.entries(allStats).map(([name, data]) => ({
    name,
    value: data.total,
    percentage: ((data.total / totalComparisons) * 100).toFixed(1)
  }));

  // Calculate stats for current user
  const userChartData = userStats ? Object.entries(userStats)
    .map(([name, data]) => ({
      name,
      value: data.total,
      percentage: ((data.total / Object.values(userStats).reduce((sum, m) => sum + m.total, 0)) * 100).toFixed(1)
    }))
    .filter(item => item.value > 0) : [];

  // Get all possible model names and sort them to ensure consistent color mapping
  const allModelNames = Object.keys(allStats || {}).sort();
  
  // Create a mapping of model name to color index
  const getColorForModel = (modelName: string) => {
    const colorIndex = allModelNames.indexOf(modelName);
    return COLORS[colorIndex % COLORS.length];
  };

  const renderPieChart = (data: typeof allUsersChartData, title: string) => (
    <Box sx={{ width: '100%', height: 400, mt: 2 }}>
      <Typography variant="h6" align="center" gutterBottom>
        {title}
      </Typography>
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={150}
            label={({ name, percentage }) => `${name} (${percentage}%)`}
          >
            {data.map((entry) => (
              <Cell 
                key={`cell-${entry.name}`} 
                fill={getColorForModel(entry.name)}
              />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value: number, name: string, props: any) => [
              `${value} selections (${props.payload.percentage}%)`,
              'Selections'
            ]}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </Box>
  );

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="lg"
      fullWidth
    >
      <DialogTitle>Model Comparison Results</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 4 }}>
          <Box sx={{ flex: 1 }}>
            {userChartData.length > 0 ? (
              <>
                <Typography variant="subtitle1" align="center" gutterBottom>
                  Your Total Comparisons: {userChartData.reduce((sum, item) => sum + item.value, 0)}
                </Typography>
                {renderPieChart(userChartData, "Your Selections")}
              </>
            ) : (
              <Typography variant="subtitle1" align="center">
                You haven't made any selections yet
              </Typography>
            )}
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle1" align="center" gutterBottom>
              All Users Total Comparisons: {totalComparisons}
            </Typography>
            {renderPieChart(allUsersChartData, "All Users Selections")}
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}; 