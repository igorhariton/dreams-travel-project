using TravelBackend.Domain.Models.Favorite;
using TravelBackend.Domain.Models.Responces;

namespace TravelBackend.BusinessLayer.Interfaces
{
    public interface IFavoriteAction
    {
        List<FavoriteDto> GetAllFavoritesAction();
        FavoriteDto? GetFavoriteByIdAction(int id);
        ActionResponce CreateFavoriteAction(FavoriteDto data);
        ActionResponce DeleteFavoriteAction(int id);
    }
}
