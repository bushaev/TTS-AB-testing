import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography } from "@mui/material";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { ModelStats } from "../types";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

interface StatsDialogProps {
  open: boolean;
  onClose: () => void;
  stats: ModelStats | null;
}

export const StatsDialog = ({ open, onClose, stats }: StatsDialogProps) => {
  const chartData = stats ? Object.entries(stats.modelSelections).map(([name, value]) => ({
    name,
    value,
    percentage: ((value / stats.totalComparisons) * 100).toFixed(1)
  })) : [];

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>Model Comparison Results</DialogTitle>
      <DialogContent>
        {stats && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Total Comparisons: {stats.totalComparisons}
            </Typography>
            <Box sx={{ width: '100%', height: 400, mt: 2 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={chartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={150}
                    label={({ name, percentage }) => `${name} (${percentage}%)`}
                  >
                    {chartData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => [
                      `${value} selections (${((value / stats.totalComparisons) * 100).toFixed(1)}%)`,
                      'Selections'
                    ]}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}; 