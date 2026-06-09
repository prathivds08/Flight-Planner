import networkx as nx
import matplotlib.pyplot as plt


def visualize_route(flights, route):

    G = nx.DiGraph()

    for flight in flights:

        G.add_edge(
            flight.start_city,
            flight.end_city,
            weight=flight.fare
        )

    pos = nx.spring_layout(G, k = 2, seed = 42)

    plt.figure(figsize=(14, 8))

    nx.draw(
    G,
    pos,
    with_labels=True,
    node_size=3000,
    font_size=10,
    node_color='skyblue'
)

    edge_labels = {
        (flight.start_city, flight.end_city): flight.fare
        for flight in flights
    }

    nx.draw_networkx_edge_labels(
        G,
        pos,
        edge_labels=edge_labels
    )

    route_edges = [
        (flight.start_city, flight.end_city)
        for flight in route
    ]

    nx.draw_networkx_edges(
        G,
        pos,
        edgelist=route_edges,
        width=4,
        edge_color='red',
        arrows=True
    )

    plt.title("Flight Route Visualization")
    plt.axis('off')
    plt.show()