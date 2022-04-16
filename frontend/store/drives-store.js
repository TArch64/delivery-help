export const state = () => ({
  pending: [],
  active: [],
  isLoaded: false,
  filterValues: null,

  pendingFilter: {
    fromCountry: null,
    fromCity: null,
    destinationCity: null,
    vehicles: [],

    departureRange: {
      from: null,
      to: null
    }
  }
});

export const getters = {
  pendingFiltered({ pending, pendingFilter }) {
    return pending.filter(drive => {
      if (pendingFilter.fromCountry && pendingFilter.fromCountry !== drive.from.country) return false;
      if (pendingFilter.fromCity && pendingFilter.fromCity !== drive.from.city) return false;
      if (pendingFilter.destinationCity && pendingFilter.destinationCity !== drive.destination.city) return false;
      if (pendingFilter.vehicles.length && !pendingFilter.vehicles.includes(drive.vehicle)) return false;

      if (pendingFilter.from && pendingFilter.to) {
        const departureTime = Number(new Date(drive.departureTime));

        if (departureTime < Number(pendingFilter.from)) return false;
        if (departureTime > Number(pendingFilter.to)) return false;
      }

      return true;
    });
  },

  pendingFilteredSorted(_, getters) {
    return getters.pendingFiltered.sort((d1, d2) => {
      return Number(new Date(d1)) - Number(new Date(d2));
    });
  }
};

export const actions = {
  async load(context) {
    if (context.state.isLoaded) return;

    const groups = {
      PENDING: [],
      ACTIVE: [],
      FINISHED: []
    };

    const filter = {
      fromCountries: new Set(),
      cities: new Set()
    };

    const response = await this.$axios.get('rides');

    for (const drive of response.data.rides) {
      groups[drive.status].push(drive);

      filter.fromCountries.add(drive.from.country);
      if (drive.from.city) filter.cities.add(drive.from.city);
      filter.cities.add(drive.destination.city);
    }

    context.commit('setPending', groups.PENDING);
    context.commit('setActive', groups.ACTIVE);

    context.commit('setFilterValues', {
      fromCountries: Array.from(filter.fromCountries),
      cities: Array.from(filter.cities)
    });

    context.commit('setLoaded', true);
  }
};

export const mutations = {
  setPending(state, drives) {
    state.pending = drives;
  },

  setActive(state, drives) {
    state.active = drives;
  },

  setLoaded(state, isLoaded) {
    state.isLoaded = isLoaded;
  },

  setFilterValues(state, values) {
    state.filterValues = values;
  }
}
