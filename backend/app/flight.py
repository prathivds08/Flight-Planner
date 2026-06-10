"""
Flight data model.

If there are n flights, and m cities:

1. Flight No. will be an integer in {0, 1, ... n-1}
2. Cities will be denoted by their name (string)
3. Time is denoted by a non-negative integer representing minutes from midnight (t=0 to t=1439)
"""


class Flight:
    def __init__(self, flight_no, start_city, departure_time, end_city, arrival_time, fare):
        self.flight_no = flight_no       # Unique ID of each flight
        self.start_city = start_city     # Name of the city where the flight departs from
        self.departure_time = departure_time  # Departure time in minutes from midnight
        self.end_city = end_city         # Name of the city where the flight arrives
        self.arrival_time = arrival_time # Arrival time in minutes from midnight
        self.fare = fare                 # Cost of taking this flight (in INR)
