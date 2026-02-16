import { confirmBooking, createBooking, getPendingBooking } from '@/api/bookingApi';
import { getConcert } from '@/api/concertApi';
import { useBookingStore } from '@/stores/bookingStore';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';


interface Booking {
  id: string;
  expiresAt: Date;
  seats: number;
  category: {
    id: string;
    name: string;
    price: number;
  };
}

interface QueueStatus {
  position: number;
  status: string;
  timeSlot?: Date;
  highDemand?: boolean;
}


export default function ReviewScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [secondsLeft, setSecondsLeft] = useState<number>(0);
  const [queueStatus, setQueryStatus] = useState<QueueStatus | null>(null);
  const [showExpiryModal, setShowExpiryModal] = useState<boolean>(false);
  const hasInitializedTimer = useRef(false);



  const { data: concert, isLoading: concertLoading } = useQuery({
    queryKey: ["concert"],
    queryFn: getConcert,
  });

  const tickets = useBookingStore((s) => s.tickets);
  const removeTicket = useBookingStore((s) => s.removeTicket);
  const getTotal = useBookingStore((s) => s.getTotal);
  const clearCart = useBookingStore((s) => s.clearCart);

  const categoryId = tickets[0]?.sectionId;

  const totalSeats = tickets.reduce((sum, t) => sum + Number(t.quantity || 0), 0);

  const { data: pendingBooking, isLoading: pendingLoading } = useQuery({
    queryKey: ["pendingBooking", categoryId],
    queryFn: () => getPendingBooking(categoryId as string),
    enabled: !!categoryId,
  });


  const createMutation = useMutation({
    mutationFn: (data) => createBooking(data),
    onSuccess: (data: Booking) => {
      console.log("Booking Created, expires", data.expiresAt);
      setBooking(data);
      setExpiresAt(new Date(data.expiresAt));
      queryClient.invalidateQueries({
        queryKey: ["pendingBooking", categoryId],
      });
    },
    onError: (err: any) => {
      console.error("Create booking error", err);
      console.error("Error response:", err?.response);
      console.error("Error data:", err?.response?.data);
      const errorMsg = err?.response?.data?.message || err?.message || "Failed to reserve the tickets";
      Alert.alert("Error", errorMsg);
      router.back();
    },
  });

  const confirmMutation = useMutation({
    mutationFn: (bookingId: string) => confirmBooking(bookingId),
    onSuccess: (data, bookingId) => {
      clearCart();
      queryClient.invalidateQueries({
        queryKey: ["pendingBooking", categoryId],
      });
      router.replace(`/book/confirmation?bookingId=${bookingId}`)
    },

    onError: (err: any) => {
      Alert.alert("Error", "Failed to confirm", err?.message);
    }
  });





  useEffect(() => {
    if (!concertLoading && concert && !booking && !createMutation.isLoading && !pendingLoading && categoryId) {
      console.log("Review mount: checking pending for category", categoryId, pendingBooking);

      if (pendingBooking) {
        const now = new Date().getTime();
        let diff = Math.floor(
          (new Date(pendingBooking.expiresAt).getTime() - now) / 1000
        );

        if (diff <= 0) {
          console.log("Mount: Skipping expired Pending");
          queryClient.setQueryData(["pendingBooking", categoryId], null);
          // handleExpiry(false);
          return;
        }

        console.log("Loading existing pending for categories", pendingBooking);
        clearCart();
        useBookingStore.getState().addTicket(
          pendingBooking.category.id,
          pendingBooking.category.name,
          pendingBooking.category.price,
          Number(pendingBooking.seats) || 0
 
        );
        setBooking(pendingBooking);
        setExpiresAt(new Date(pendingBooking.expiresAt));
        setQueryStatus(null);
      } else if (tickets.length > 0) {
        console.log("Creating booking with:", { categoryId, seats: totalSeats });
        createMutation.mutate({ categoryId, seats: totalSeats })
      } else {
        router.back();
      }
    }
  }, [concertLoading, concert?.id, categoryId, booking, createMutation.isLoading, pendingLoading, pendingBooking, totalSeats])

  // Timer useEffect - MUST be before early returns
  useEffect(() => {
    if (!expiresAt) return;

    // Start ticking interval based on expiresAt state
    hasInitializedTimer.current = true;

    const tick = () => {
      const now = Date.now();
      const diff = Math.max(0, Math.floor((new Date(expiresAt).getTime() - now) / 1000));
      setSecondsLeft(diff);
      if (diff <= 0) {
        // show alert and cleanup when time runs out
        handleExpiry(true);
      }
    };

    // Initialize immediately then every second
    tick();
    const id = setInterval(tick, 1000);

    return () => clearInterval(id);
  }, [expiresAt])

  const handleExpiry = (showAlert = true) => {
    if (hasInitializedTimer.current || showAlert) {
      console.log("expiry triggered", showAlert);
      if (showAlert) {
        setShowExpiryModal(true);
        return;
      }

      // silent expiry fallback
      clearCart();
      setBooking(null);
      setExpiresAt(null);
      setQueryStatus(null);
      queryClient.invalidateQueries({ queryKey: ["pendingBooking"] });
      router.replace("/book");
    }
  };

  const onConfirmExpiry = () => {
    setShowExpiryModal(false);
    clearCart();
    setBooking(null);
    setExpiresAt(null);
    setQueryStatus(null);
    queryClient.invalidateQueries({ queryKey: ["pendingBooking"] });
    router.replace("/book");
  };

  // useMemo hook - MUST be before early returns  
  const ticketSummary = useMemo(() => {
    return tickets.map((t) => {
      return {
        id: t.sectionId,
        name: t.name,
        price: t.price,
        qty: t.quantity,
        lineTotal: t.price * t.quantity,
      };
    });
  }, [tickets]);

  // Early returns - no hooks after this point
  if (createMutation.isLoading || concertLoading || pendingLoading) {
    return (
      <SafeAreaView className='flex-1 bg-black justify-center items-center'>
        <ActivityIndicator size={"large"} color={"#fff"} />
        <Text className="text-white mt-2">Loading...</Text>
      </SafeAreaView>
    )
  }

  if (createMutation.isError || !concert || !categoryId) {
    return (
      <SafeAreaView className='flex-1 bg-black justify-center items-center'>
        <Text className='text-red-500'>Error:{createMutation.error?.message || "No Tickets Selected"}</Text>
        <Pressable onPress={() => router.back()}>
          <Text className='text-white'>Go Back</Text>
        </Pressable>
      </SafeAreaView>
    )
  }

  const mm = Math.floor(secondsLeft / 60).toString().padStart(2, "0");
  const ss = (secondsLeft % 60).toString().padStart(2, "0");


  const posterUri = concert?.imageUrl || "https://placeholder.com/100×150";
  const eventTitle = concert?.name || "";
  const venue = concert?.venue || "";

  const datetime = new Date(concert.date).toLocaleString("en-US", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  });


  const orderAmount = getTotal();
  const bookingFee = Math.max(0, Math.round(orderAmount * 0.0826));
  const grandTotal = orderAmount + bookingFee;






  return (
    <SafeAreaView className='flex-1 bg-black'>
      <View className='px-4 pt-3 pb-2'>
        <View className="flex-row items-center">
          <Pressable className="p-2 rounded-full" onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </Pressable>

          <View className="flex-1">
            <Text className="text-white text-lg font-semibold">
              Review your booking
            </Text>
          </View>
        </View>

        <View className="px-4">
          <View className="bg-[#1a1a1a] rounded-full px-4 py-2 items-center justify-center mb-4">
            <Text className="text-gray-300">
              Complete your booking in{" "}
              <Text className="text-green-400 font-semibold">
                {mm}:{ss}
              </Text>{" "}
              mins
            </Text>
          </View>
        </View>

      </View>

      <ScrollView>
        <View className='flex-row items-start mb-4 px-4'>
          <Image resizeMode='cover' className='w-16 h-20 rounded-md mr-3' source={{ uri: posterUri }} />
          <View className='flex-1'>
            <Text className='text-white font-semibold mb-1'>{eventTitle}</Text>
            <Text className='text-gray-400'>{venue}</Text>
          </View>
        </View>

        <View className='bg-[#111] border border-gray-800 rounded-2xl px-5 py-2 mb-5'>
          <Text className='text-gray-300 font-semibold mb-3'>{datetime}</Text>
          {ticketSummary.length === 0 ? (
            <Text className="text-gray-400 mb-3">
              No tickets selected
            </Text>
          ) : (
            ticketSummary.map((t) => (
              <View key={t.id} className="mb-3">
                <View className="flex-row justify-between items-start">

                  <View className="flex-1 pr-3">
                    <Text className="text-white font-semibold">
                      {t.qty} x {t.name}
                    </Text>
                  </View>

                  <View className="items-end">
                    <Text className="text-white font-semibold">
                      ₹{t.lineTotal.toLocaleString()}
                    </Text>

                    <Pressable className="mt-2">
                      <Text className="text-gray-400 underline">
                        Remove
                      </Text>
                    </Pressable>
                  </View>

                </View>
                <View className="flex-row items-center mt-3">
                  <View className="w-7 h-7 rounded-md bg-gray-800 mr-3 items-center justify-center">
                    <Ionicons
                      name="ticket-outline"
                      size={16}
                      color="#9ca3af"
                    />
                  </View>

                  <Text className="text-gray-400 text-sm">
                    M-Ticket: Entry using the QR code in your app
                  </Text>
                </View>

              </View>
            ))
          )}

        </View>
      </ScrollView>

      <View className="absolute bottom-4 left-0 right-0 bg-black border-t border-gray-800 p-3 flex-row items-center justify-between">

        <View className="flex-row items-center">
          <View className="bg-white rounded-md px-2 py-1 mr-3">
            <Ionicons
              name="wallet-outline"
              size={18}
              color="#111"
            />
          </View>

          <View>
            <Text className="text-gray-400 text-xs">Pay Using</Text>
            <Text className="text-white font-semibold">Google Pay UPI</Text>
          </View>
        </View>

        <Pressable className='bg-white px-8 py-3 rounded-full flex-row items-center'
          disabled={confirmMutation.isPending || secondsLeft <= 0 || !booking}
          onPress={() => booking && confirmMutation.mutate(booking.id)}
        >
          <View className="mr-4 items-end">
            <Text className="text-gray-500 text-sm">
              ₹{grandTotal.toFixed(1)}
            </Text>
            <Text className="text-black font-semibold text-sm">Total</Text>
          </View>
          {confirmMutation.isPending && (
            <ActivityIndicator
              size="small"
              color="#000"
              className="mr-2"
            />
          )}

          <Text className="text-black font-semibold">
            {confirmMutation.isPending ? "Confirming..." : "Pay now"}
          </Text>

        </Pressable>

      </View>

      {showExpiryModal && (
        <View className="absolute inset-0 items-center justify-center bg-black/50">
          <View className="bg-white rounded-2xl p-5 mx-6 w-[90%] shadow-lg">
            <Text className="text-black text-lg font-semibold text-center mb-2">Time expired</Text>
            <Text className="text-gray-600 text-center mb-4">We have released the tickets you have chosen, please book again</Text>
            <View className="border-t border-gray-200 -mx-5" />
            <Pressable onPress={onConfirmExpiry} className="py-3">
              <Text className="text-blue-500 text-center font-semibold">OK</Text>
            </Pressable>
          </View>
        </View>
      )}

    </SafeAreaView>
  )
}


const styles = StyleSheet.create({})