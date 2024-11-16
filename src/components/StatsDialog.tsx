import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography } from "@mui/material";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

interface StatsDialogProps {
  open: boolean;
  onClose: () => void;
  stats: Record<string, { total: number; byFile: Record<number, number> }> | null;
}

export const StatsDialog = ({ open, onClose, stats }: StatsDialogProps) => {
  if (!stats) {
    return null;
  }

  const totalComparisons = Object.values(stats).reduce((sum, model) => sum + model.total, 0);
  
  const chartData = Object.entries(stats).map(([name, data]) => ({
    name,
    value: data.total,
    percentage: ((data.total / totalComparisons) * 100).toFixed(1)
  }));

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>Model Comparison Results</DialogTitle>
      <DialogContent>
        <Box>
          <Typography variant="h6" gutterBottom>
            Total Comparisons: {totalComparisons}
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
                  {chartData.map((_, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => [
                    `${value} selections (${((value / totalComparisons) * 100).toFixed(1)}%)`,
                    'Selections'
                  ]}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
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