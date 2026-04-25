using TravelBackend.BusinessLayer.Core;
using TravelBackend.BusinessLayer.Interfaces;
using TravelBackend.Domain.Models.Favorite;
using TravelBackend.Domain.Models.Responces;

namespace TravelBackend.BusinessLayer.Structure
{
    public class FavoriteActionExecution : FavoriteActions, IFavoriteAction
    {
        public ActionResponce CreateFavoriteAction(FavoriteDto data)
        {
            return CreateFavoriteActionExecution(data);
        }

        public ActionResponce DeleteFavoriteAction(int id)
        {
            return DeleteFavoriteActionExecution(id);
        }

        public List<FavoriteDto> GetAllFavoritesAction()
        {
            return GetAllFavoritesActionExecution();
        }

        public FavoriteDto? GetFavoriteByIdAction(int id)
        {
            return GetFavoriteByIdActionExecution(id);
        }
    }
}
