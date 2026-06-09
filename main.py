from visualization.graph_visualizer import visualize_route
import pandas as pd
from flight import Flight
from planner import Planner


def load_flights(csv_file):

    df = pd.read_csv(csv_file)

    flights = []

    for _, row in df.iterrows():

        flights.append(
            Flight(
                row['flight_no'],
                row['start_city'],
                row['departure_time'],
                row['end_city'],
                row['arrival_time'],
                row['fare']
            )
        )

    return flights


def main():

    flights = load_flights("data/flights.csv")

    flight_planner = Planner(flights)

    while True:

        print("\n===== Flight Planner =====")
        print("1. Cheapest Route")
        print("2. Least Flights Earliest Route")
        print("3. Least Flights Cheapest Route")
        print("4. Exit")

        choice = input("\nEnter your choice: ")

        if choice == "4":
            print("\nThank you for using Flight Planner!")
            break

        start_city = input("Enter source city: ")
        end_city = input("Enter destination city: ")

        t1 = int(input("Enter earliest departure time: "))
        t2 = int(input("Enter latest arrival time: "))

        if choice == "1":

            route = flight_planner.cheapest_route(
                start_city,
                end_city,
                t1,
                t2
            )

        elif choice == "2":

            route = flight_planner.least_flights_earliest_route(
                start_city,
                end_city,
                t1,
                t2
            )

        elif choice == "3":

            route = flight_planner.least_flights_cheapest_route(
                start_city,
                end_city,
                t1,
                t2
            )

        else:
            print("\nInvalid Choice!")
            continue

        if not route:
            print("\nNo valid route found!")
            continue

        print("\nBest Route:\n")

        total_fare = 0

        for flight in route:

            total_fare += flight.fare

            print(
                f"{flight.start_city} -> "
                f"{flight.end_city} | "
                f"Fare: ₹{flight.fare}"
            )

        print(f"\nTotal Fare: ₹{total_fare}")
        visualize_route(flights, route)

if __name__ == "__main__":
    main()