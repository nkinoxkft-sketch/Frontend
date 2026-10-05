

export const resfreshStates =  (queryClient) =>{

    queryClient.invalidateQueries({ queryKey: ['userData'] });
    queryClient.invalidateQueries({ queryKey: ['updatePlanData'] });
    queryClient.invalidateQueries({ queryKey: ['subData'] });
    queryClient.invalidateQueries({ queryKey: ['sessions'] });
    queryClient.invalidateQueries({ queryKey: ['pubData'] });


}