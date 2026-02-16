import { cancelPendingBooking, getPendingBooking } from "@/api/bookingApi";
import { getConcert } from "@/api/concertApi";
import { useBookingStore } from "@/stores/bookingStore";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router, useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function TicketScreen() {
  // --- Hooks (always run in same order) ---
  const Router = useRouter();
  const { categoryId } = useLocalSearchParams<{ categoryId?: string }>();
const [showModal, setShowModal] = useState(false);
const [isFocused, setIsFocused] = useState(false);

  const queryClient = useQueryClient();

  const tickets = useBookingStore((s) => s.tickets);
  const addTicket = useBookingStore((s) => s.addTicket);
  const removeTicket = useBookingStore((s) => s.removeTicket);
  const updateQuantity = useBookingStore((s) => s.updateQuantity);
  const getTotal = useBookingStore((s) => s.getTotal);
  const clearCart = useBookingStore((s) => s.clearCart);

  const [pendingSecondsLeft, setPendingSecondsLeft] = useState(0);
  const [initialLoading, setInitialLoading] = useState(true);
  const [hasCheckedInitialState, setHasCheckedInitialState] = useState(false);

  const {
    data: concert,
    isLoading: concertLoading,
    error: concertError,
  } = useQuery({
    queryKey: ["concert"],
    queryFn: getConcert,
  });

  const { data: pendingBooking, isLoading: pendingLoading, error: pendingError } = useQuery({
    queryKey: ["pendingBooking", categoryId],
    queryFn: () => getPendingBooking(categoryId as string),
    enabled: !!categoryId,
    retry: 1, // Only retry once on failure
    retryDelay: 500,
  });

  const hasShownModal = useRef(false);

  // Reset state when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      hasShownModal.current = false;
      setHasCheckedInitialState(false);
      setIsFocused(true);
      queryClient.invalidateQueries({ queryKey: ["pendingBooking", categoryId] });

      return () => {
        // On blur: hide modal and reset shown flag so it can show again when returning
        setIsFocused(false);
        setShowModal(false);
        hasShownModal.current = false;
      };
    }, [categoryId, queryClient])
  );

  // --- Effects (stable order) ---
  useEffect(() => {
    const currentTotal = tickets?.reduce((acc, t) => acc + Number(t.quantity || 0), 0) ?? 0;
    const currentPrice = getTotal();
    console.log("Tickets screen mounted. Initial tickets:", tickets);
    console.log("Total tickets:", currentTotal);
    console.log("Total price:", currentPrice);
    console.log("Category ID:", categoryId);
  }, []);

  // Log pending booking errors
  useEffect(() => {
    if (pendingError) {
      console.error("Pending booking API error:", {
        categoryId,
        error: pendingError,
        message: pendingError?.message,
        response: pendingError?.response?.data,
        status: pendingError?.response?.status
      });
    }
  }, [pendingError]);

  // Load or clear cart based on pending booking status
  useEffect(() => {
    if (!pendingLoading && !hasCheckedInitialState) {
      setHasCheckedInitialState(true);
      
      // If there was an error checking for pending bookings, just log it and continue
      if (pendingError) {
        console.log("Error checking pending booking (continuing anyway):", pendingError);
        if (tickets.length > 0) {
          console.log("Clearing cart due to pending check error");
          clearCart();
        }
        return;
      }
      
      const now = Date.now();
      const isExpired = pendingBooking && pendingBooking.expiresAt ? new Date(pendingBooking.expiresAt).getTime() <= now : true;
      
      console.log("Pending booking check:", {
        pendingBooking,
        currentCategoryId: categoryId,
        pendingCategoryId: pendingBooking?.category?.id,
        isExpired,
        seats: pendingBooking?.seats,
        ticketsInStore: tickets.length
      });
      
      // If there's an active pending booking for THIS category, load it into the store
      if (pendingBooking && !isExpired && pendingBooking.category && pendingBooking.category.id === categoryId) {
        console.log("Loading pending booking tickets into store:", pendingBooking.seats);
        clearCart();
        addTicket(
          pendingBooking.category.id,
          pendingBooking.category.name,
          pendingBooking.category.price,
          Number(pendingBooking.seats) || 0
        );
      } else {
        // Clear cart if no active booking for this category
        if (tickets.length > 0) {
          console.log("Clearing cart - no active booking session for this category");
          clearCart();
        }
      }
    }
  }, [pendingLoading, hasCheckedInitialState, pendingError]);

  useEffect(() => {
    if (!concertLoading && concert) {
      setInitialLoading(false);
    } else {
      setInitialLoading(true);
    }
  }, [concertLoading, concert]);

  useEffect(() => {
    if (!pendingBooking || !pendingBooking.expiresAt) {
      setPendingSecondsLeft(0);
      return;
    }

    const now = Date.now();
    let diff = Math.floor((new Date(pendingBooking.expiresAt).getTime() - now) / 1000);

    if (diff <= 0) {
      queryClient.setQueryData(["pendingBooking", categoryId], null);
      setPendingSecondsLeft(0);
      return;
    }

    setPendingSecondsLeft(diff);

    const id = setInterval(() => {
      if (!pendingBooking || !pendingBooking.expiresAt) {
        clearInterval(id);
        setPendingSecondsLeft(0);
        return;
      }
      const updated = Math.max(0, Math.floor((new Date(pendingBooking.expiresAt).getTime() - Date.now()) / 1000));
      setPendingSecondsLeft(updated);
      if (updated <= 0) {
        clearInterval(id);
        queryClient.invalidateQueries({ queryKey: ["pendingBooking", categoryId] });
      }
    }, 1000);

    return () => clearInterval(id);
  }, [pendingBooking, categoryId, queryClient]);

  // Additional useEffects - MUST be before early returns
  useEffect(() => {
    if (pendingBooking && pendingBooking.expiresAt && pendingBooking.category && categoryId === pendingBooking.category.id) {
        const now = Date.now();
        const isExpired = new Date(pendingBooking.expiresAt).getTime() <= now;
        
        if (!isExpired) {
          clearCart();
          const { category, seats } = pendingBooking; 
          addTicket(category.id, category.name, category.price, Number(seats) || 0);
        } else {
          // Session expired, clear cart
          clearCart();
        }
    }
  }, [pendingBooking, categoryId, addTicket, clearCart]);

  useEffect(() => {
    const isActiveSession = pendingBooking && pendingSecondsLeft > 0;

    // Only show modal when this screen is focused to avoid it appearing over other screens
    if (isActiveSession && !pendingLoading && !concertLoading && !hasShownModal.current && isFocused) {
        hasShownModal.current = true;
        setShowModal(true);
    }
  }, [pendingBooking, pendingLoading, concertLoading, pendingSecondsLeft, isFocused]);

  useEffect(()=>{
    if(showModal && pendingSecondsLeft <=0){
      setShowModal(false);
      clearCart();
      hasShownModal.current = false;
      Alert.alert("Session Expired", "Your booking session has expired. Please try booking again.");
      queryClient.setQueryData(["pendingBooking", categoryId], null);
    }
  },[pendingSecondsLeft,showModal, clearCart, categoryId, queryClient]);

  // Mutation hook - MUST be before early returns
  const cancelMutation = useMutation({
    mutationFn: () => cancelPendingBooking(categoryId as string),
    onSuccess: () => {
      clearCart();
      queryClient.invalidateQueries({
        queryKey: ["pendingBooking", categoryId]
      });
      queryClient.setQueryData(["pendingBooking", categoryId], null);
      setShowModal(false);
      hasShownModal.current = false;
      Alert.alert("Session Deleted", "Your booking session has been deleted. You can start a new booking.");
    },
    onError: (err: any) => {
      Alert.alert("Error", "Failed to cancel session: " + err.message);
    }
  });

  // --- Early loading return (no hooks after this) ---
  // Don't block on pendingLoading if there's an error
  if (concertLoading || !concert || initialLoading) {
    return (
      <SafeAreaView className="flex-1 bg-black justify-center items-center">
        <ActivityIndicator size={"large"} color={"#fff"} />
        <Text className="text-white mt-2">Loading...</Text>
      </SafeAreaView>
    );
  }
  
  // Show loading only if pending is still loading and no error
  if (pendingLoading && !pendingError) {
    return (
      <SafeAreaView className="flex-1 bg-black justify-center items-center">
        <ActivityIndicator size={"large"} color={"#fff"} />
        <Text className="text-white mt-2">Checking session...</Text>
      </SafeAreaView>
    );
  }

  // --- Derived values (safe after hooks) ---
  const formattedDate = new Date(concert.date).toLocaleDateString("en-US", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });

  const formattedTime = new Date(concert.date)
    .toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    })
    .toUpperCase();

  const categoryData = concert?.categories.find((cat: { id: string }) => cat.id === categoryId);

  if (!categoryData) {
    return (
      <SafeAreaView className="flex-1 bg-black justify-center items-center">
        <Text className="text-white">Category not found</Text>
        <Pressable onPress={() => router.back()}>
          <Text className="text-white">Go Back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }




  const { name: title, price } = categoryData as { name: string; price: number };

  const myTicket = tickets?.find((t) => t.sectionId === categoryId);
  const quantity = myTicket?.quantity ?? 0;

  const totalTickets = tickets?.reduce((acc, t) => acc + Number(t.quantity || 0), 0) ?? 0;
  const totalPrice = getTotal();
  // Only consider it an active session if the pending booking is for THIS category and no error
  const isActiveSession = !pendingError && !!pendingBooking && pendingSecondsLeft > 0 && pendingBooking.category?.id === categoryId;
  
  console.log("Render state:", {
    categoryId,
    isActiveSession,
    pendingError: pendingError?.message,
    pendingBooking: pendingBooking?.id,
    pendingCategoryId: pendingBooking?.category?.id,
    pendingSecondsLeft,
    totalTickets,
    totalPrice
  });

  // --- Handlers ---
  const handleAdd = () => {
    if (isActiveSession) return;
    
    // Check if adding one more ticket would exceed the limit
    if (totalTickets >= 10) {
      Alert.alert("Maximum Limit", "You can book a maximum of 10 tickets per booking");
      return;
    }
    
    if (!myTicket) {
      addTicket(categoryId as string, title, price, 1);
    } else {
      updateQuantity(categoryId as string, myTicket.quantity + 1);
    }
  };

  const handleRemove = () => {
    if (isActiveSession) return;
    if (!myTicket) return;
    const newQty = myTicket.quantity - 1;
    if (newQty <= 0) removeTicket(categoryId as string);
    else updateQuantity(categoryId as string, newQty);
  };

  const handleContinue = () => {
    if (totalTickets === 0) {
      Alert.alert("No Tickets, Please atleast add one ticket");
      return;
    }
    if (isActiveSession) {
      queryClient.invalidateQueries({ queryKey: ["pendingBooking", categoryId] });
    }
    router.push("/book/review");
  };





  if (concertError || !concert || !categoryId) {
    return (
        <SafeAreaView className="flex-1 bg-black justify-center items-center">
            <Text className="text-red-500">
                Error loading data: {concertError?.message || "No category"}
            </Text>
            <Pressable
                onPress={() => router.back()}
                className="mt-4 p-3 bg-gray-700 rounded"
            >
                <Text className="text-white">Go Back</Text>
            </Pressable>
        </SafeAreaView>
    );
}

console.log("ticketsss", pendingBooking)
const pendingMm = Math.floor(pendingSecondsLeft / 60).toString().padStart(2,"0");
const pendingSs = (pendingSecondsLeft % 60).toString().padStart(2,"0");

  // --- Render ---
  return (
    <SafeAreaView className="flex-1 bg-black">
      <View className="px-4 pt-3 pb-2">
        <View className="flex-row items-center">
          <Pressable className="p-2 rounded-full" onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color={"#fff"} />
          </Pressable>

          <View className="ml-3 flex-1">
            <Text className="text-white text-lg font-semibold">{concert?.name}</Text>
            <Text className="text-gray-400 text-sm mt-1">{formattedDate} |{formattedTime} onwards | {concert?.venue}</Text>
          </View>
        </View>
      </View>

      <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingBottom: 140 }}>
        <Text className="text-white text-xl font-bold mb-5">Choose Tickets</Text>

        <View className="bg-[#111] border border-gray-800 rounded-2xl px-4 py-5 mb-4">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-white font-semibold text-base">{title.toUpperCase()}</Text>

            {quantity === 0 ? (
              <Pressable onPress={handleAdd} className={`w-28 py-2 border rounded-lg items-center justify-center ${isActiveSession ? "border-gray-500 bg-gray-100" : "border-gray-300 bg-gray-800"}`}>
                <Text className={`font-medium ${isActiveSession ? "text-red-600" : "text-white"}`}>{isActiveSession ? "Session Active" : "Add Ticket"}</Text>
              </Pressable>
            ) : (
              <View className="w-28 py-2 rounded-lg bg-white flex-row items-center justify-between px-3">
                <Pressable onPress={handleRemove} className={`p-1 rounded ${isActiveSession ? "opacity-50" : ""}`}>
                  <Text className={`text-lg font-bold ${isActiveSession ? "text-gray-400" : "text-black"}`}>-</Text>
                </Pressable>
                <Text className="text-black font-semibold text-base">{quantity}</Text>
                <Pressable onPress={handleAdd} disabled={totalTickets >= 10} className={`p-1 rounded ${isActiveSession || totalTickets >= 10 ? "opacity-50" : ""}`}>
                  <Text className={`text-lg font-bold ${isActiveSession || totalTickets >= 10 ? "text-gray-400" : "text-black"}`}>+</Text>
                </Pressable>
              </View>
            )}
          </View>

          <Text className="text-gray-300 text-base mb-3">₹{price.toLocaleString()} each</Text>

          <View className="space-y-1 mt-2">
            <Text className="text-gray-400 text-sm">• Each ticket grants entry to one individual in the {title} zone</Text>
            <Text className="text-gray-400 text-sm mt-1">• This is a standing section.</Text>
            <Text className="text-gray-400 text-sm mt-1">• Seats will be allocated on a first-come, first-served basis.</Text>
          </View>
        </View>

        {totalTickets > 0 && (
          <View className="bg-[#111] border border-gray-800 rounded-2xl px-4 py-4 mb-4">
            <Text className="text-white font-semibold mb-2">Order Summary</Text>
            <Text className="text-gray-400 text-sm">{totalTickets} ticket{totalTickets > 1 ? "s" : ""} • ₹ {totalPrice.toLocaleString()}</Text>
          </View>
        )}
      </ScrollView>

      <View className="absolute bottom-0 left-0 right-0 bg-black border-t border-gray-800 p-4 flex-row items-center justify-between">
        <View>
          <Text className="text-gray-400 text-sm">{totalTickets > 0 ? `${totalTickets} ticket${totalTickets > 1 ? "s" : ""} • ` : ""}₹</Text>
          <Text className="text-white text-lg font-semibold">{totalPrice.toLocaleString()}</Text>
        </View>

        <Pressable
          onPress={handleContinue}
          disabled={totalTickets === 0}
          className={`px-6 py-3 rounded-full ${totalTickets === 0 ? "bg-gray-700" : "bg-white"}`}>
          <Text className={`font-semibold ${totalTickets === 0 ? "text-gray-300" : "text-black"}`}>
            {isActiveSession ? "Continue Session" : "Continue"}
          </Text>
        </Pressable>
      </View>

<Modal
  visible={showModal}
  transparent={true}
  animationType="fade"
  onRequestClose={() => setShowModal(false)}
>
  <View className="flex-1 justify-center items-center bg-black/60">
    <View className="bg-white rounded-2xl p-6 w-[85%] max-w-sm">
      
      <Text className="text-black text-xl font-bold mb-3">
        Active Session Detected
      </Text>

      <Text className="text-gray-700 text-base mb-1">
        You have an active booking for{" "}
        <Text className="font-semibold text-black">
          {pendingBooking?.category?.name || "tickets"}
        </Text>{" "}
        <Text className="font-semibold text-black">
          ({pendingMm}:{pendingSs} left)
        </Text>.
      </Text>

      <Text className="text-gray-700 text-base mb-6">
        Complete payment to secure them.
      </Text>

      <View className="flex-row gap-3">
        <Pressable 
          disabled={cancelMutation.isPending} 
          onPress={() => {
            setShowModal(false);
            cancelMutation.mutate();
          }} 
          className="flex-1 bg-red-50 py-3 rounded-lg items-center border border-red-200"
        >
          <Text className="text-red-600 font-semibold text-base">
            {cancelMutation?.isPending ? "Deleting..." : "Delete Session"}
          </Text>
        </Pressable>
        
        <Pressable 
          onPress={() => {
            setShowModal(false);
            handleContinue();
          }} 
          className="flex-1 bg-blue-500 py-3 rounded-lg items-center"
        >
          <Text className="text-white font-semibold text-base">
            Continue Booking
          </Text>
        </Pressable>
      </View>

    </View>
  </View>
</Modal>


    </SafeAreaView>
  );
}
