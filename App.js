import { Accelerometer } from "expo-sensors";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState, useRef } from "react";
import {
  Dimensions,
  StyleSheet,
  Text,
  View,
  Platform,
  Animated,
} from "react-native";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

const BASKET_WIDTH = 90;
const BASKET_HEIGHT = 50;
const ITEM_WIDTH = 40;
const ITEM_HEIGHT = 40;
const INITIAL_LIVES = 3;

const randomFruit = () =>
  ["🍊", "🍓", "🍎", "🍇", "🍒", "🥭"][Math.floor(Math.random() * 6)];

const Item = ({ item }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  return (
    <Animated.Text
      style={[
        styles.item,
        { left: item.x, top: item.y, opacity: fadeAnim },
      ]}
    >
      {item.type}
    </Animated.Text>
  );
};

const Game = ({ onGameOver }) => {
  const [basketX, setBasketX] = useState((screenWidth - BASKET_WIDTH) / 2);
  const [items, setItems] = useState([]);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(INITIAL_LIVES);

  useEffect(() => {
    if (Platform.OS !== "web") {
      Accelerometer.setUpdateInterval(100);
      const subscription = Accelerometer.addListener(({ x }) => {
        const movement = x * 80;
        setBasketX((prev) =>
          Math.max(0, Math.min(screenWidth - BASKET_WIDTH, prev + movement))
        );
      });
      return () => subscription.remove();
    } else {
      const handleMouseMove = (e) => {
        setBasketX(e.clientX - BASKET_WIDTH / 2);
      };
      window.addEventListener("mousemove", handleMouseMove);
      return () => window.removeEventListener("mousemove", handleMouseMove);
    }
  }, []);

  useEffect(() => {
    const itemInterval = setInterval(() => {
      const newItem = {
        id: Date.now(),
        x: Math.random() * (screenWidth - ITEM_WIDTH),
        y: -ITEM_HEIGHT,
        type: Math.random() > 0.2 ? randomFruit() : "💣",
      };
      setItems((prev) => [...prev, newItem]);
    }, 1500);

    return () => clearInterval(itemInterval);
  }, []);

  useEffect(() => {
    const gameInterval = setInterval(() => {
      setItems((prev) =>
        prev
          .map((item) => ({ ...item, y: item.y + 5 }))
          .filter((item) => {
            const hit =
              item.x < basketX + BASKET_WIDTH &&
              item.x + ITEM_WIDTH > basketX &&
              item.y + ITEM_HEIGHT > screenHeight - BASKET_HEIGHT;

            if (hit) {
              if (item.type !== "💣") {
                setScore((s) => s + 1);
              } else {
                setLives((l) => {
                  const newLives = l - 1;
                  if (newLives <= 0) {
                    onGameOver(score);
                  }
                  return newLives;
                });
              }
              return false;
            }
            return item.y < screenHeight;
          })
      );
    }, 40);

    return () => clearInterval(gameInterval);
  }, [basketX, onGameOver, score]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Fruit Catcher</Text>
      <View style={styles.stats}>
        <Text style={styles.score}>Score: {score}</Text>
        <Text style={styles.lives}>Lives: {lives}</Text>
      </View>
      {items.map((item) => (
        <Item key={item.id} item={item} />
      ))}
      <View style={[styles.basket, { left: basketX }]}>
        <Text style={styles.basketContent}>🧺</Text>
      </View>
    </View>
  );
};

const GameOver = ({ score, onRestart }) => (
  <View style={styles.container}>
    <View style={styles.gameOverOverlay} />
    <Text style={styles.gameOver}>Game Over</Text>
    <Text style={styles.finalScore}>Your Score: {score}</Text>
    <Text style={styles.restartButton} onPress={onRestart}>
      Play Again
    </Text>
  </View>
);

export default function App() {
  const [isGameOver, setIsGameOver] = useState(false);
  const [finalScore, setFinalScore] = useState(0);

  const handleGameOver = (score) => {
    setFinalScore(score);
    setIsGameOver(true);
  };

  const handleRestart = () => {
    setIsGameOver(false);
    setFinalScore(0);
  };

  return (
    <>
      <StatusBar style="light" />
      {isGameOver ? (
        <GameOver score={finalScore} onRestart={handleRestart} />
      ) : (
        <Game onGameOver={handleGameOver} />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#001f3f",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 42,
    fontWeight: "bold",
    position: "absolute",
    top: 60,
    color: "#fff",
    fontFamily: "Arial",
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  stats: {
    position: "absolute",
    top: 120,
    flexDirection: "row",
    justifyContent: "space-between",
    width: "90%",
  },
  score: {
    fontSize: 24,
    color: "#fff",
    fontWeight: "bold",
    fontFamily: "Arial",
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 5,
  },
  lives: {
    fontSize: 24,
    color: "#fff",
    fontWeight: "bold",
    fontFamily: "Arial",
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 5,
  },
  item: {
    position: "absolute",
    fontSize: 30,
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 3,
  },
  basket: {
    position: "absolute",
    bottom: 20,
    width: BASKET_WIDTH,
    height: BASKET_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
  },
  basketContent: {
    fontSize: 60,
  },
  gameOverOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },
  gameOver: {
    fontSize: 56,
    fontWeight: "bold",
    color: "#ff4d4d",
    fontFamily: "Arial",
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: -2, height: 2 },
    textShadowRadius: 10,
    marginBottom: 20,
  },
  finalScore: {
    fontSize: 32,
    color: "#fff",
    marginVertical: 20,
    fontFamily: "Arial",
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 5,
  },
  restartButton: {
    fontSize: 24,
    color: "#fff",
    backgroundColor: "#4CAF50",
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 15,
    overflow: "hidden",
    marginTop: 20,
    fontFamily: "Arial",
    fontWeight: "bold",
    letterSpacing: 1,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});
