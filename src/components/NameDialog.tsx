import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Typography } from "@mui/material";

interface NameDialogProps {
  open: boolean;
  name: string;
  onNameChange: (name: string) => void;
  onSubmit: () => void;
}

export const NameDialog = ({ open, name, onNameChange, onSubmit }: NameDialogProps) => (
  <Dialog 
    open={open} 
    onClose={(e, reason) => {
      if (reason !== 'backdropClick') onSubmit();
    }}
    disableEscapeKeyDown
  >
    <DialogTitle>Welcome!</DialogTitle>
    <DialogContent>
      <Typography variant="body1" gutterBottom sx={{ mt: 2 }}>
        Please enter your name to continue:
      </Typography>
      <TextField
        autoFocus
        margin="dense"
        fullWidth
        value={name}
        onChange={(e) => onNameChange(e.target.value)}
        onKeyPress={(e) => {
          if (e.key === 'Enter') onSubmit();
        }}
        autoComplete="off"
        inputProps={{
          autoComplete: 'off',
          'data-lpignore': 'true',
          'data-form-type': 'other',
        }}
        type="text"
        placeholder="Enter your name"
        name="display-name"
      />
    </DialogContent>
    <DialogActions>
      <Button 
        onClick={onSubmit}
        disabled={!name.trim()}
        variant="contained"
        color="primary"
      >
        Continue
      </Button>
    </DialogActions>
  </Dialog>
); 