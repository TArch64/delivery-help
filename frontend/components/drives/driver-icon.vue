<template>
    <v-icon :class="iconClasses" dense>{{ iconName }}</v-icon>
</template>

<script>
import { mdiAccount, mdiAccountCheck } from '@mdi/js';

export default {
    name: 'driver-icon',

    props: {
        driver: Object,
        verified: Boolean
    },

    computed: {
        iconName() {
            return this.verified ? mdiAccountCheck : mdiAccount;
        },

        iconClasses() {
            return {
                'driver-icon--verified': this.verified
            };
        }
    }
};
</script>

<style scoped>
.driver-icon--verified {
    color: #3F51B5;;
}
</style>
