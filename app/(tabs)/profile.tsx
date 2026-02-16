import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import EditScreenInfo from '@/components/EditScreenInfo';

import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Feather from "@expo/vector-icons/Feather";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";


type CardProps = {
  icon: React.ReactNode,
  label: string,
}

type MenuRowProps = {
  label: string,
  icon: React.ReactNode,
  value?: string,
}


const Card: React.FC<CardProps> = ({ icon, label }) => (
  <TouchableOpacity className='w-[30%] bg-neutral-900 rounded-2xl p-4 items-center'>
    {icon}
    <Text className='text-white mt-3 text-center text-sm'>{label}</Text>
  </TouchableOpacity>
)

const MenuRow: React.FC<MenuRowProps> = ({label,icon,value}) => (
  <TouchableOpacity className='bg-neutral-900 rounded-2xl px-4 py-4 flex-row items-center mb-2'>
    {icon}
    <Text className='text-white ml-4 text-base flex-1'>{label}</Text>
    {value && <Text className='text-neutral-400 mr-3'>{value}</Text>}
    <Ionicons name='chevron-forward' size={22} color={"white"}/>
  </TouchableOpacity>
)

export default function TabTwoScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className='flex-1 bg-black'>
      <ScrollView className='flex-1 bg-black px-5 pt-4'>

         <View className="flex-row items-center mb-6">
      {/* Back Button */}
      <TouchableOpacity onPress={() => router.back()}>
        <Ionicons name="chevron-back" size={26} color="white" />
      </TouchableOpacity>

      {/* Header Title */}
      <Text className="text-white text-xl font-semibold ml-3">Profile</Text>
    </View>

        <View className="flex-row items-center mb-8">
          <Image
            source={{
              uri: "https://images.pexels.com/photos/35588219/pexels-photo-35588219.jpeg",
            }}
            className="w-20 h-20 rounded-full bg-neutral-800"
          />
          <View className="ml-4">
            <Text className="text-white text-lg font-semibold">Eijaz</Text>
            <Text className="text-neutral-400 mt-1">+91 3191986216</Text>
          </View>
          <TouchableOpacity className="ml-auto">
            <Feather name="edit-2" size={20} color="white" />
          </TouchableOpacity>
        </View>

        <Text className='text-white text-lg font-semibold mb-3'>All Bookings</Text>
      <View className='flex-row justify-between mb-8'>
        <Card icon={<Feather name='coffee' size={28} color={"#fff"} />} label="bookings" />
        <Card icon={<Feather name="film" size={28} color={"#fff"} />
} label="movie-ticket" />
        <TouchableOpacity
          onPress={() => router.push("/event-details")}
          className="w-[30%] bg-neutral-900 rounded-2xl p-2 items-center"
        >
         
          <FontAwesome5 name="guitar" size={26} color="white" className="mt-3" />
          
          <Text className="text-white mt-3 text-center text-sm">Event tickets</Text>
        </TouchableOpacity>
      </View>

        <Text className='text-white text-lg font-semibold mb-3'>Vouchers</Text>
        <MenuRow label="Collected vouchers" icon={<Ionicons name='gift-outline' size={26} color={"white"} />} />
        <Text className="text-white text-lg font-semibold mb-3">
  Payments
</Text>

<MenuRow
  label="Dining transactions"
  icon={<MaterialIcons name="receipt" size={22} color="white" />}
/>

<MenuRow
  label="Store transactions"
  icon={<MaterialIcons name="receipt-long" size={22} color="white" />}
/>

<MenuRow
  label="District Money"
  icon={<Ionicons name="wallet-outline" size={24} color="white" />}
/>

<MenuRow
  label="Claim a Gift Card"
  icon={<Ionicons name="card-outline" size={24} color="white" />}
/>

        <Text className='text-white text-lg font-semibold mb-5'>Manage</Text>
        <MenuRow
  label="Your reviews"
  icon={<Feather name="edit" size={20} color="white" />}
/>

<MenuRow
  label="Hotlists"
  icon={<Feather name="bookmark" size={22} color="white" />}
/>

<MenuRow
  label="Movie reminders"
  icon={<Feather name="bell" size={22} color="white" />}
/>

<MenuRow
  label="Payment settings"
  icon={<Ionicons name="settings-outline" size={22} color="white" />}
/>

<MenuRow
  label="Appearance"
  value="Dark"
  icon={<Feather name="aperture" size={22} color="white" />}
/>



      </ScrollView>


      
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,


    fontWeight: 'bold',
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: '80%',
  },
});
