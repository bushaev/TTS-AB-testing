import { useState, useEffect } from "react";
import useLocalStorageState from "use-local-storage-state";
import styled from "styled-components";
import {
  Typography,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Checkbox,
  Radio,
  RadioGroup,
  FormControlLabel,
  Paper,
  Box,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import SendIcon from "@mui/icons-material/Send";

interface Todo {
  id: number;
  text: string;
  done: boolean;
}

interface AudioDemo {
  id: number;
  text: string;
  models: {
    [key: string]: string; // model name: audio URL
  };
  selectedModel: string | null;
  comment: string;
}

const AppContainer = styled.div`
  max-width: 600px;
  margin: 0 auto;
  padding: 2rem;
  text-align: center;
`;

const StyledButton = styled(Button)`
  && {
    margin-top: 1rem;
  }
`;

const StyledListItemText = styled(ListItemText)<{ done: boolean }>`
  && {
    text-decoration: ${(props) => (props.done ? "line-through" : "none")};
  }
`;

const AudioPlayer = styled.audio`
  width: 100%;
  margin-top: 1rem;
`;

const CommentSection = styled(Paper)`
  margin-top: 1rem;
  padding: 1rem;
`;

function App() {
  const [todos, setTodos] = useLocalStorageState<Todo[]>("todos", {
    defaultValue: [],
  });
  const [newTodo, setNewTodo] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState(""); // Add this line
  const [demos, setDemos] = useLocalStorageState<AudioDemo[]>("tts_demos", {
    defaultValue: [],
  });
  const [newDemoText, setNewDemoText] = useState("");

  useEffect(() => {
    if (todos.length === 0) {
      const boilerplateTodos = [
        { id: 1, text: "Install Node.js", done: false },
        { id: 2, text: "Install Cursor IDE", done: false },
        { id: 3, text: "Log into Github", done: false },
        { id: 4, text: "Fork a repo", done: false },
        { id: 5, text: "Make changes", done: false },
        { id: 6, text: "Commit", done: false },
        { id: 7, text: "Deploy", done: false },
      ];
      setTodos(boilerplateTodos);
    }
  }, [todos, setTodos]);

  useEffect(() => {
    if (demos.length === 0) {
      const boilerplateDemos: AudioDemo[] = [
        {
          id: 1,
          text: "Welcome to our TTS model demo.",
          models: {
            model1: "/path/to/audio1.mp3",
            model2: "/path/to/audio2.mp3",
          },
          selectedModel: null,
          comment: "",
        },
        {
          id: 2,
          text: "This is another example of our TTS capabilities.",
          models: {
            model1: "/path/to/audio3.mp3",
            model2: "/path/to/audio4.mp3",
          },
          selectedModel: null,
          comment: "",
        },
      ];
      setDemos(boilerplateDemos);
    }
  }, [demos, setDemos]);

  const handleAddTodo = () => {
    if (newTodo.trim() !== "") {
      setTodos([
        ...todos,
        { id: Date.now(), text: newTodo.trim(), done: false },
      ]);
      setNewTodo("");
    }
  };

  const handleDeleteTodo = (id: number) => {
    setTodos(todos.filter((todo) => todo.id !== id));
  };

  const handleToggleTodo = (id: number) => {
    setTodos(
      todos.map((todo) =>
        todo.id === id ? { ...todo, done: !todo.done } : todo
      )
    );
  };

  const handleEditTodo = (id: number) => {
    setEditingId(id);
    const todoToEdit = todos.find((todo) => todo.id === id);
    if (todoToEdit) {
      setEditText(todoToEdit.text);
    }
  };

  const handleUpdateTodo = (id: number) => {
    if (editText.trim() !== "") {
      setTodos(
        todos.map((todo) =>
          todo.id === id ? { ...todo, text: editText.trim() } : todo
        )
      );
    }
    setEditingId(null);
    setEditText("");
  };

  const handleAddDemo = () => {
    if (newDemoText.trim() !== "") {
      setDemos([
        ...demos,
        {
          id: Date.now(),
          text: newDemoText.trim(),
          models: {
            model1: "/path/to/new_audio1.mp3",
            model2: "/path/to/new_audio2.mp3",
          },
          selectedModel: null,
          comment: "",
        },
      ]);
      setNewDemoText("");
    }
  };

  const handleModelSelection = (demoId: number, model: string) => {
    setDemos(
      demos.map((demo) =>
        demo.id === demoId ? { ...demo, selectedModel: model } : demo
      )
    );
  };

  const handleCommentChange = (demoId: number, comment: string) => {
    setDemos(
      demos.map((demo) =>
        demo.id === demoId ? { ...demo, comment } : demo
      )
    );
  };

  return (
    <AppContainer>
      <Typography variant="h4" component="h1" gutterBottom>
        Todo List
      </Typography>
      <TextField
        fullWidth
        variant="outlined"
        label="New Todo"
        value={newTodo}
        onChange={(e) => setNewTodo(e.target.value)}
        onKeyPress={(e) => e.key === "Enter" && handleAddTodo()}
        autoFocus // Add this line to enable autofocus
      />
      <StyledButton
        variant="contained"
        color="primary"
        fullWidth
        onClick={handleAddTodo}
      >
        Add Todo
      </StyledButton>
      <List>
        {todos.map((todo) => (
          <ListItem key={todo.id} dense>
            <Checkbox
              edge="start"
              checked={todo.done}
              onChange={() => handleToggleTodo(todo.id)}
            />
            {editingId === todo.id ? (
              <TextField
                fullWidth
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                onBlur={() => handleUpdateTodo(todo.id)}
                onKeyPress={(e) =>
                  e.key === "Enter" && handleUpdateTodo(todo.id)
                }
                autoFocus
              />
            ) : (
              <StyledListItemText primary={todo.text} done={todo.done} />
            )}
            <ListItemSecondaryAction>
              <IconButton
                edge="end"
                aria-label="edit"
                onClick={() => handleEditTodo(todo.id)}
              >
                <EditIcon />
              </IconButton>
              <IconButton
                edge="end"
                aria-label="delete"
                onClick={() => handleDeleteTodo(todo.id)}
              >
                <DeleteIcon />
              </IconButton>
            </ListItemSecondaryAction>
          </ListItem>
        ))}
      </List>
      <Typography variant="h4" component="h1" gutterBottom>
        TTS Model Demo
      </Typography>
      <TextField
        fullWidth
        variant="outlined"
        label="New Demo Text"
        value={newDemoText}
        onChange={(e) => setNewDemoText(e.target.value)}
        onKeyPress={(e) => e.key === "Enter" && handleAddDemo()}
      />
      <StyledButton
        variant="contained"
        color="primary"
        fullWidth
        onClick={handleAddDemo}
      >
        Add Demo
      </StyledButton>
      <List>
        {demos.map((demo) => (
          <ListItem key={demo.id} alignItems="flex-start">
            <Box width="100%">
              <Typography variant="h6">{demo.text}</Typography>
              <RadioGroup
                row
                value={demo.selectedModel || ""}
                onChange={(e) => handleModelSelection(demo.id, e.target.value)}
              >
                {Object.entries(demo.models).map(([model, audioUrl]) => (
                  <FormControlLabel
                    key={model}
                    value={model}
                    control={<Radio />}
                    label={
                      <Box display="flex" alignItems="center">
                        {model}
                        <IconButton
                          onClick={() => {
                            const audio = new Audio(audioUrl);
                            audio.play();
                          }}
                        >
                          <PlayArrowIcon />
                        </IconButton>
                      </Box>
                    }
                  />
                ))}
              </RadioGroup>
              {demo.selectedModel && (
                <AudioPlayer
                  controls
                  src={demo.models[demo.selectedModel]}
                />
              )}
              <CommentSection>
                <TextField
                  fullWidth
                  variant="outlined"
                  label="Comment"
                  value={demo.comment}
                  onChange={(e) => handleCommentChange(demo.id, e.target.value)}
                  multiline
                  rows={2}
                />
                <StyledButton
                  variant="contained"
                  color="primary"
                  endIcon={<SendIcon />}
                  onClick={() => console.log(`Comment submitted for demo ${demo.id}`)}
                >
                  Submit Comment
                </StyledButton>
              </CommentSection>
            </Box>
          </ListItem>
        ))}
      </List>
    </AppContainer>
  );
}

export default App;
